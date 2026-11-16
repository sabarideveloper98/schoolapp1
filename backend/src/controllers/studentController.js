const mongoose = require('mongoose');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const User = require('../models/User');
const Class = require('../models/Class');
const School = require('../models/School');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenUtils');

/**
 * Helper to resolve the student document associated with the authenticated user/token
 */
const resolveStudentForUser = async (user, decodedToken = {}) => {
    if (!user) return null;

    // 1. If user object is already a populated/persisted Student document
    if (user.student_name || (user.admission_number && user.class_id)) {
        if (!user.class_id || !user.class_id.class) {
            return await Student.findById(user._id).populate('class_id').populate('school_id');
        }
        return user;
    }

    // 2. Direct student_id on user object
    if (user.student_id) {
        const student = await Student.findById(user.student_id).populate('class_id').populate('school_id');
        if (student) return student;
    }

    // 3. User reference_id pointing to Student
    if (user.reference_id) {
        const student = await Student.findById(user.reference_id).populate('class_id').populate('school_id');
        if (student) return student;
    }

    // 4. Token payload claims
    if (decodedToken.student_id || decodedToken.reference_id) {
        const student = await Student.findById(decodedToken.student_id || decodedToken.reference_id).populate('class_id').populate('school_id');
        if (student) return student;
    }

    // 5. Student model lookup by user_id
    let student = await Student.findOne({ user_id: user._id }).populate('class_id').populate('school_id');
    if (student) return student;

    // 6. Direct lookup by user._id in Student collection
    student = await Student.findById(user._id).populate('class_id').populate('school_id');
    if (student) return student;

    // 7. Match by student_email
    if (user.email) {
        student = await Student.findOne({ student_email: user.email.toLowerCase() }).populate('class_id').populate('school_id');
        if (student) return student;
    }

    // 8. Match by student_phone
    if (user.phone) {
        student = await Student.findOne({ student_phone: user.phone }).populate('class_id').populate('school_id');
        if (student) return student;
    }

    return null;
};

/**
 * Helper to parse month names or numbers
 */
const parseMonth = (monthVal) => {
    if (!monthVal) return null;
    const monthNum = parseInt(monthVal, 10);
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return monthNum;
    }
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const index = monthNames.indexOf(monthVal.toString().trim().toLowerCase());
    if (index !== -1) return index + 1;

    const shortNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const shortIndex = shortNames.indexOf(monthVal.toString().trim().toLowerCase());
    if (shortIndex !== -1) return shortIndex + 1;

    return null;
};

/**
 * @desc    Get Attendance Report for the logged-in Student
 * @route   GET /api/student/attendance/report
 * @access  Private (Student only)
 */
const getStudentAttendanceReport = async (req, res) => {
    try {
        // 1. Validate student authentication & role permissions
        if (!req.user || req.user.role !== 'Student') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Only authenticated students are authorized to access this attendance report.'
            });
        }

        // 2. Identify the student automatically using the logged-in student's ID from session/token
        const student = await resolveStudentForUser(req.user, req.decodedToken || {});
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student record not found for the authenticated account.'
            });
        }

        // 3. Security: Prevent student from retrieving another student's report
        const attemptedStudentId = (req.query && (req.query.student_id || req.query.studentId)) ||
                                   (req.params && (req.params.studentId || req.params.student_id)) ||
                                   (req.body && (req.body.student_id || req.body.studentId));
        if (attemptedStudentId && attemptedStudentId.toString() !== student._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access: You cannot access attendance records of another student.'
            });
        }

        // 4. Parse & Validate Date Filters
        const fromDateParam = req.query.fromDate || req.query.from_date || req.query.startDate || req.query.start_date;
        const toDateParam = req.query.toDate || req.query.to_date || req.query.endDate || req.query.end_date;
        const monthParam = req.query.month;
        const yearParam = req.query.year;
        const academicYearParam = req.query.academicYear || req.query.academic_year;

        let startDate = null;
        let endDate = null;
        let filterApplied = false;

        // --- Filter Mode A: Specific fromDate / toDate range ---
        if (fromDateParam || toDateParam) {
            if (fromDateParam) {
                const parsedFrom = new Date(fromDateParam);
                if (isNaN(parsedFrom.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid fromDate format. Please use YYYY-MM-DD.'
                    });
                }
                startDate = new Date(parsedFrom);
                startDate.setHours(0, 0, 0, 0);
            }

            if (toDateParam) {
                const parsedTo = new Date(toDateParam);
                if (isNaN(parsedTo.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid toDate format. Please use YYYY-MM-DD.'
                    });
                }
                endDate = new Date(parsedTo);
                endDate.setHours(23, 59, 59, 999);
            }

            if (startDate && endDate && startDate > endDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date range: fromDate cannot be later than toDate.'
                });
            }

            filterApplied = true;
        }

        // --- Filter Mode B: Month (with optional year) ---
        else if (monthParam) {
            const parsedM = parseMonth(monthParam);
            if (!parsedM) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid month filter. Month must be between 1 and 12 (or a valid month name).'
                });
            }

            let y;
            if (yearParam) {
                y = parseInt(yearParam, 10);
                if (isNaN(y) || y < 1900 || y > 2100) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid year filter. Please provide a valid 4-digit year.'
                    });
                }
            } else {
                y = new Date().getFullYear();
            }

            startDate = new Date(y, parsedM - 1, 1, 0, 0, 0, 0);
            endDate = new Date(y, parsedM, 0, 23, 59, 59, 999);
            filterApplied = true;
        }

        // --- Filter Mode C: Year Only ---
        else if (yearParam) {
            const y = parseInt(yearParam, 10);
            if (isNaN(y) || y < 1900 || y > 2100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid year filter. Please provide a valid 4-digit year.'
                });
            }
            startDate = new Date(y, 0, 1, 0, 0, 0, 0);
            endDate = new Date(y, 11, 31, 23, 59, 59, 999);
            filterApplied = true;
        }

        // --- Filter Mode D: Specific Academic Year (e.g. 2026-2027) ---
        else if (academicYearParam) {
            const match = academicYearParam.toString().trim().match(/^(\d{4})-(\d{4})$/);
            if (match) {
                const y1 = parseInt(match[1], 10);
                const y2 = parseInt(match[2], 10);
                startDate = new Date(y1, 5, 1, 0, 0, 0, 0); // June 1st
                endDate = new Date(y2, 4, 31, 23, 59, 59, 999); // May 31st
            } else {
                const singleY = parseInt(academicYearParam, 10);
                if (!isNaN(singleY) && singleY >= 1900 && singleY <= 2100) {
                    startDate = new Date(singleY, 0, 1, 0, 0, 0, 0);
                    endDate = new Date(singleY, 11, 31, 23, 59, 59, 999);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid academicYear format. Expected format: YYYY-YYYY (e.g., 2026-2027).'
                    });
                }
            }
            filterApplied = true;
        }

        // --- Filter Mode E: Default (Current Academic Year) ---
        if (!filterApplied) {
            const targetAcadYear = student.academic_year || '2026-2027';
            const match = targetAcadYear.match(/^(\d{4})-(\d{4})$/);
            if (match) {
                const y1 = parseInt(match[1], 10);
                const y2 = parseInt(match[2], 10);
                startDate = new Date(y1, 5, 1, 0, 0, 0, 0); // June 1st
                endDate = new Date(y2, 4, 31, 23, 59, 59, 999); // May 31st
            } else {
                const now = new Date();
                const curYear = now.getFullYear();
                const startYear = now.getMonth() >= 5 ? curYear : curYear - 1;
                startDate = new Date(startYear, 5, 1, 0, 0, 0, 0);
                endDate = new Date(startYear + 1, 4, 31, 23, 59, 59, 999);
            }
        }

        // 5. Query attendance records from StudentAttendance
        const attendanceQuery = {
            school_id: student.school_id,
            $or: [
                { 'records.student_id': student._id },
                { student_id: student._id }
            ]
        };

        if (startDate || endDate) {
            attendanceQuery.date = {};
            if (startDate) attendanceQuery.date.$gte = startDate;
            if (endDate) attendanceQuery.date.$lte = endDate;
        }

        const attendanceDocs = await StudentAttendance.find(attendanceQuery)
            .sort({ date: 1 })
            .lean();

        // 6. Process records & deduplicate date-wise
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const recordsMap = new Map();

        for (const doc of attendanceDocs) {
            let rec = null;
            if (Array.isArray(doc.records)) {
                rec = doc.records.find(r => r.student_id && r.student_id.toString() === student._id.toString());
            }
            if (!rec && doc.student_id && doc.student_id.toString() === student._id.toString()) {
                rec = doc;
            }

            if (!rec) continue;

            const docDate = new Date(doc.date);
            const dateKey = docDate.toISOString().split('T')[0];
            const dayName = dayNames[docDate.getDay()];

            const status = rec.status || 'Present';
            const remarks = rec.remarks && rec.remarks.trim() ? rec.remarks.trim() : null;
            const checkInTime = rec.check_in_time || rec.in_time || rec.checkInTime || null;
            const checkOutTime = rec.check_out_time || rec.out_time || rec.checkOutTime || null;

            // Upsert by date to prevent duplicate records on the same day
            recordsMap.set(dateKey, {
                date: dateKey,
                day: dayName,
                status,
                checkInTime,
                checkOutTime,
                remarks
            });
        }

        const attendanceRecords = Array.from(recordsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

        // 7. Calculate attendance summary
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let halfDays = 0;

        for (const item of attendanceRecords) {
            const s = (item.status || '').trim().toLowerCase();
            if (s === 'present') {
                presentDays++;
            } else if (s === 'absent') {
                absentDays++;
            } else if (s === 'late') {
                lateDays++;
            } else if (s === 'half day' || s === 'halfday' || s === 'half-day') {
                halfDays++;
            }
        }

        // Total working days is count of all non-holiday marked days
        const totalWorkingDays = attendanceRecords.filter(r => (r.status || '').trim().toLowerCase() !== 'holiday').length;

        // Effective present days accounts for present, late, and half-day (0.5)
        const effectivePresent = presentDays + lateDays + (halfDays * 0.5);
        const attendancePercentage = totalWorkingDays > 0
            ? Math.min(100, Math.max(0, Number(((effectivePresent / totalWorkingDays) * 100).toFixed(2))))
            : 0;

        // 8. Class and section resolution
        const className = student.class || (student.class_id ? (student.class_id.class || student.class_id.name || '') : '');
        const sectionName = student.section || (student.class_id ? (student.class_id.section || '') : '');
        const academicYearValue = academicYearParam || student.academic_year || '2026-2027';

        return res.status(200).json({
            success: true,
            message: 'Student attendance report retrieved successfully',
            data: {
                student: {
                    studentId: student._id.toString(),
                    studentName: student.student_name || [student.first_name, student.last_name].filter(Boolean).join(' ').trim(),
                    admissionNumber: student.admission_number || '',
                    rollNumber: student.roll_no || '',
                    class: className,
                    section: sectionName,
                    academicYear: academicYearValue
                },
                summary: {
                    totalWorkingDays,
                    presentDays,
                    absentDays,
                    lateDays,
                    halfDays,
                    attendancePercentage
                },
                attendanceRecords
            }
        });
    } catch (error) {
        console.error('getStudentAttendanceReport error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve student attendance report',
            error: error.message
        });
    }
};

/**
 * @desc    Student Login Endpoint
 * @route   POST /api/student/login
 * @access  Public
 */
const loginStudent = async (req, res) => {
    try {
        const { email, phone, mobile, admission_number, roll_no, username, identifier, password } = req.body;
        const contactInput = (admission_number || email || phone || mobile || roll_no || username || identifier || '').toString().trim();

        if (!contactInput || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide credentials (admission number, email, or mobile) and password'
            });
        }

        // 1. Look for User with role 'Student'
        let user = null;
        if (contactInput.includes('@')) {
            user = await User.findOne({ email: contactInput.toLowerCase(), role: 'Student' });
        } else {
            user = await User.findOne({
                $or: [
                    { phone: contactInput },
                    { email: contactInput.toLowerCase() }
                ],
                role: 'Student'
            });
        }

        // 2. If not found in User, check Student collection
        let student = null;
        if (user) {
            student = await resolveStudentForUser(user);
        } else {
            // Find by admission number or student email or phone
            student = await Student.findOne({
                $or: [
                    { admission_number: contactInput },
                    { student_email: contactInput.toLowerCase() },
                    { student_phone: contactInput }
                ]
            }).populate('class_id').populate('school_id');

            if (student) {
                // Check if user exists for this student
                user = await User.findOne({
                    $or: [
                        { reference_id: student._id },
                        { email: student.student_email },
                        { phone: student.student_phone }
                    ]
                });
            }
        }

        if (!user && !student) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials. Student account not found.'
            });
        }

        // Password verification
        let isMatch = false;
        if (user) {
            isMatch = await user.matchPassword(password);
        } else if (student && student.student_password) {
            const bcrypt = require('bcryptjs');
            isMatch = await bcrypt.compare(password, student.student_password);
        }

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or password.'
            });
        }

        const studentId = student ? student._id : (user.reference_id || user._id);
        const schoolId = (student && student.school_id) ? (student.school_id._id || student.school_id) : user.school_id;

        const token = jwt.sign(
            { id: studentId, role: 'Student', school_id: schoolId },
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            success: true,
            message: 'Student login successful',
            token,
            student: student ? {
                studentId: student._id,
                studentName: student.student_name,
                admissionNumber: student.admission_number,
                rollNumber: student.roll_no,
                class: student.class || (student.class_id ? student.class_id.class : ''),
                section: student.section || (student.class_id ? student.class_id.section : ''),
                academicYear: student.academic_year
            } : null
        });
    } catch (error) {
        console.error('loginStudent error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during student login',
            error: error.message
        });
    }
};

module.exports = {
    getStudentAttendanceReport,
    loginStudent
};
