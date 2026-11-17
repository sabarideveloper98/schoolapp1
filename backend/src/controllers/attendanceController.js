const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const School = require('../models/School');
const StaffAttendance = require('../models/StaffAttendance');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');
const User = require('../models/User');
const Class = require('../models/Class');
const mongoose = require('mongoose');

// Unified helper for standardized error responses
const sendErrorResponse = (res, statusCode, message, errorCode, details = null) => {
    console.error(`[ATTENDANCE_ERROR] ${errorCode} (${statusCode}): ${message}`, details ? `| Details: ${details}` : '');
    return res.status(statusCode).json({
        success: false,
        message,
        error: {
            code: errorCode,
            details: details || message
        }
    });
};

// Robust helper to get school_id from the logged-in user / SchoolAdmin
const getSchoolId = async (adminId) => {
    let school = await School.findOne({ admin_id: adminId });
    if (school) return school._id;

    // Check if user has direct school_id assignment
    const userObj = await User.findById(adminId);
    if (userObj?.school_id) {
        school = await School.findById(userObj.school_id);
        if (school) return school._id;
    }

    // Fallback: Check if any school exists in this tenant
    const anySchool = await School.findOne({});
    if (anySchool) return anySchool._id;

    throw new Error('School not found for this admin');
};

// Normalize date to UTC start of day with validation
const parseAndNormalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

// @desc    Get staff attendance list by date and role
// @route   GET /api/schooladmin/attendance
// @access  Private (SchoolAdmin only)
const getStaffAttendance = async (req, res) => {
    try {
        let school_id;
        try {
            school_id = await getSchoolId(req.user._id);
        } catch (schoolErr) {
            return sendErrorResponse(res, 404, 'School not found for this administrator account', 'SCHOOL_NOT_FOUND', schoolErr.message);
        }

        const { role, date } = req.query;

        if (!role || !date) {
            return sendErrorResponse(res, 400, 'Role and Date parameters are required', 'MISSING_REQUIRED_PARAMS');
        }

        if (role !== 'Teacher' && role !== 'Staff') {
            return sendErrorResponse(res, 400, 'Role parameter must be either "Teacher" or "Staff"', 'INVALID_ROLE');
        }

        const queryDate = parseAndNormalizeDate(date);
        if (!queryDate) {
            return sendErrorResponse(res, 400, 'Invalid date format. Please provide a valid date string (e.g. YYYY-MM-DD)', 'INVALID_DATE_FORMAT');
        }

        // Find existing attendance
        const attendance = await StaffAttendance.findOne({
            school_id,
            role_filter: role,
            date: queryDate
        });

        if (attendance) {
            const records = attendance.records || [];
            return res.status(200).json({
                success: true,
                message: 'Staff attendance retrieved successfully',
                _id: attendance._id,
                school_id: attendance.school_id,
                date: attendance.date,
                role_filter: attendance.role_filter,
                records,
                notify_via: attendance.notify_via || 'Do not send',
                attendance,
                data: {
                    attendance,
                    records,
                    totalRecords: records.length
                }
            });
        }

        // If no attendance exists for this date, build template list of teachers or staff
        let records = [];
        if (role === 'Teacher') {
            const teachers = await Teacher.find({ school_id });
            records = teachers.map(t => ({
                user_id: t.user_id,
                name: t.name,
                role: 'Teacher',
                status: 'Present',
                in_time: '09:00 AM',
                out_time: '05:00 PM',
                remarks: ''
            }));
        } else if (role === 'Staff') {
            const staff = await Staff.find({ school_id });
            records = staff.map(s => ({
                user_id: s.user_id,
                name: s.name,
                role: 'Staff',
                status: 'Present',
                in_time: '09:00 AM',
                out_time: '05:00 PM',
                remarks: ''
            }));
        }

        const templateAttendance = {
            school_id,
            date: queryDate,
            role_filter: role,
            records,
            notify_via: 'Do not send'
        };

        return res.status(200).json({
            success: true,
            message: 'Template staff attendance list generated successfully',
            school_id,
            date: queryDate,
            role_filter: role,
            records,
            notify_via: 'Do not send',
            attendance: templateAttendance,
            data: {
                attendance: templateAttendance,
                records,
                totalRecords: records.length
            }
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Server error while fetching staff attendance', 'ATTENDANCE_FETCH_ERROR', error.message);
    }
};

// @desc    Save/Update staff attendance records
// @route   POST /api/schooladmin/attendance
// @access  Private (SchoolAdmin only)
const saveStaffAttendance = async (req, res) => {
    try {
        let school_id;
        try {
            school_id = await getSchoolId(req.user._id);
        } catch (schoolErr) {
            return sendErrorResponse(res, 404, 'School not found for this administrator account', 'SCHOOL_NOT_FOUND', schoolErr.message);
        }

        const { role, date, records, notify_via, academic_year } = req.body;

        if (!role || !date || !records) {
            return sendErrorResponse(res, 400, 'Role, Date, and Records are required', 'MISSING_REQUIRED_FIELDS');
        }

        if (role !== 'Teacher' && role !== 'Staff') {
            return sendErrorResponse(res, 400, 'Role must be either "Teacher" or "Staff"', 'INVALID_ROLE');
        }

        if (!Array.isArray(records)) {
            return sendErrorResponse(res, 400, 'Records must be an array of staff attendance objects', 'INVALID_RECORDS_FORMAT');
        }

        const queryDate = parseAndNormalizeDate(date);
        if (!queryDate) {
            return sendErrorResponse(res, 400, 'Invalid date format. Please provide a valid date string (e.g. YYYY-MM-DD)', 'INVALID_DATE_FORMAT');
        }

        // Sanitize and validate record items
        const sanitizedRecords = records.map((r, idx) => {
            if (!r.user_id) {
                throw new Error(`Record at index ${idx} is missing user_id`);
            }
            return {
                user_id: r.user_id,
                name: r.name || 'Staff Member',
                role: r.role || role,
                status: ['Present', 'Absent', 'Leave', 'Late', 'Half Day', 'Holiday'].includes(r.status) ? r.status : 'Present',
                in_time: r.in_time || '09:00 AM',
                out_time: r.out_time || '05:00 PM',
                remarks: r.remarks || ''
            };
        });

        const updateData = {
            school_id,
            date: queryDate,
            role_filter: role,
            records: sanitizedRecords,
            notify_via: notify_via || 'Do not send',
            updated_by: req.user._id
        };
        if (academic_year) {
            updateData.academic_year = academic_year;
        }

        const attendance = await StaffAttendance.findOneAndUpdate(
            { school_id, date: queryDate, role_filter: role },
            {
                $set: updateData,
                $setOnInsert: { created_by: req.user._id }
            },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Attendance saved successfully',
            attendance,
            data: {
                attendance,
                records: sanitizedRecords,
                totalRecords: sanitizedRecords.length
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return sendErrorResponse(res, 422, 'Validation error while saving staff attendance', 'ATTENDANCE_VALIDATION_ERROR', error.message);
        }
        return sendErrorResponse(res, 500, 'Server error while saving staff attendance', 'ATTENDANCE_SAVE_ERROR', error.message);
    }
};

// @desc    Get staff attendance report (Month-wise, Week-wise, or Individual)
// @route   GET /api/schooladmin/attendance/report
// @access  Private (SchoolAdmin only)
const getStaffAttendanceReport = async (req, res) => {
    try {
        let school_id;
        try {
            school_id = await getSchoolId(req.user._id);
        } catch (schoolErr) {
            return sendErrorResponse(res, 404, 'School not found for this administrator account', 'SCHOOL_NOT_FOUND', schoolErr.message);
        }

        const { role, month, year, week_start, user_id } = req.query;

        let startDate, endDate;

        if (month && year) {
            const m = parseInt(month, 10) - 1; // 0-indexed
            const y = parseInt(year, 10);
            if (isNaN(m) || m < 0 || m > 11 || isNaN(y) || y < 2000) {
                return sendErrorResponse(res, 400, 'Invalid month or year parameters', 'INVALID_MONTH_YEAR');
            }
            startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
            endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        } else if (week_start) {
            startDate = parseAndNormalizeDate(week_start);
            if (!startDate) {
                return sendErrorResponse(res, 400, 'Invalid week_start date format. Expected YYYY-MM-DD.', 'INVALID_WEEK_START');
            }
            endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 6);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return sendErrorResponse(res, 400, 'Either month/year or week_start parameter is required', 'MISSING_DATE_RANGE');
        }

        // Fetch attendance records in date range
        const attendanceDocs = await StaffAttendance.find({
            school_id,
            date: { $gte: startDate, $lte: endDate }
        });

        if (user_id) {
            if (!mongoose.Types.ObjectId.isValid(user_id)) {
                return sendErrorResponse(res, 400, 'Invalid user_id parameter', 'INVALID_USER_ID');
            }

            // Individual Staff Report: Fetch date-by-date attendance for this user
            const records = [];
            const curDate = new Date(startDate);
            while (curDate <= endDate) {
                const doc = attendanceDocs.find(d => {
                    const d1 = new Date(d.date).toISOString().split('T')[0];
                    const d2 = curDate.toISOString().split('T')[0];
                    return d1 === d2;
                });

                let status = 'N/A';
                let in_time = '-';
                let out_time = '-';

                if (doc) {
                    const rec = doc.records.find(r => r.user_id && r.user_id.toString() === user_id.toString());
                    if (rec) {
                        status = rec.status;
                        in_time = rec.in_time || '-';
                        out_time = rec.out_time || '-';
                    }
                }

                records.push({
                    date: new Date(curDate),
                    status,
                    in_time,
                    out_time
                });

                curDate.setUTCDate(curDate.getUTCDate() + 1);
            }

            return res.status(200).json({
                success: true,
                message: 'Individual staff attendance report retrieved successfully',
                user_id,
                startDate,
                endDate,
                records,
                data: {
                    user_id,
                    startDate,
                    endDate,
                    records,
                    totalRecords: records.length
                }
            });
        } else {
            // Overview: List of all staff with present/absent counts
            let people = [];
            if (!role || role === 'Teacher') {
                const teachers = await Teacher.find({ school_id });
                people.push(...teachers.map(t => ({ id: t.user_id, name: t.name, role: 'Teacher' })));
            }
            if (!role || role === 'Staff') {
                const staff = await Staff.find({ school_id });
                people.push(...staff.map(s => ({ id: s.user_id, name: s.name, role: 'Staff' })));
            }

            const summary = people.map(p => {
                let present = 0;
                let absent = 0;

                attendanceDocs.forEach(doc => {
                    if (doc.role_filter === p.role) {
                        const rec = doc.records.find(r => r.user_id && r.user_id.toString() === p.id.toString());
                        if (rec) {
                            if (rec.status === 'Present') present++;
                            else if (rec.status === 'Absent') absent++;
                        }
                    }
                });

                const total = present + absent;
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;

                return {
                    user_id: p.id,
                    name: p.name,
                    role: p.role,
                    present,
                    absent,
                    rate
                };
            });

            return res.status(200).json({
                success: true,
                message: 'Staff attendance overview report retrieved successfully',
                startDate,
                endDate,
                summary,
                data: {
                    startDate,
                    endDate,
                    summary,
                    totalRecords: summary.length
                }
            });
        }
    } catch (error) {
        return sendErrorResponse(res, 500, 'Server error while generating staff attendance report', 'ATTENDANCE_REPORT_ERROR', error.message);
    }
};

// @desc    Get student attendance by date and class
// @route   GET /api/schooladmin/student-attendance
// @access  Private (SchoolAdmin only)
const getStudentAttendance = async (req, res) => {
    try {
        let school_id;
        try {
            school_id = await getSchoolId(req.user._id);
        } catch (schoolErr) {
            return sendErrorResponse(res, 404, 'School not found for this administrator account', 'SCHOOL_NOT_FOUND', schoolErr.message);
        }

        const { class_id, date } = req.query;

        if (!class_id || !date) {
            return sendErrorResponse(res, 400, 'Class ID and Date parameters are required', 'MISSING_REQUIRED_PARAMS');
        }

        if (!mongoose.Types.ObjectId.isValid(class_id)) {
            return sendErrorResponse(res, 400, 'Invalid class_id parameter format', 'INVALID_CLASS_ID');
        }

        const queryDate = parseAndNormalizeDate(date);
        if (!queryDate) {
            return sendErrorResponse(res, 400, 'Invalid date format. Please provide a valid date string (e.g. YYYY-MM-DD)', 'INVALID_DATE_FORMAT');
        }

        // Validate that class exists in this school
        const classDoc = await Class.findOne({ _id: class_id, school_id });
        if (!classDoc) {
            return sendErrorResponse(res, 404, 'Class not found in this school', 'CLASS_NOT_FOUND');
        }

        const school = await School.findById(school_id);

        const attendance = await StudentAttendance.findOne({
            school_id,
            class_id,
            date: queryDate
        });

        if (attendance) {
            const records = attendance.records || [];
            return res.status(200).json({
                success: true,
                message: 'Student attendance retrieved successfully',
                school_name: school ? school.name : 'School',
                attendance,
                records,
                data: {
                    school_name: school ? school.name : 'School',
                    attendance,
                    records,
                    totalRecords: records.length
                }
            });
        }

        // Generate template list of students in class
        const students = await Student.find({ school_id, class_id }).select('student_name roll_no admission_number photo');
        
        const records = students.map(s => ({
            student_id: s._id,
            name: s.student_name,
            admission_number: s.admission_number || s._id.toString().substring(0, 16).toUpperCase(),
            roll_no: s.roll_no || '',
            photo: s.photo || '',
            status: 'Present',
            remarks: ''
        }));

        const templateAttendance = {
            school_id,
            class_id,
            date: queryDate,
            academic_year: '2026-2027',
            records
        };

        return res.status(200).json({
            success: true,
            message: 'Template student attendance list generated successfully',
            school_name: school ? school.name : 'School',
            attendance: templateAttendance,
            records,
            data: {
                school_name: school ? school.name : 'School',
                attendance: templateAttendance,
                records,
                totalRecords: records.length
            }
        });
    } catch (error) {
        return sendErrorResponse(res, 500, 'Server error while fetching student attendance', 'ATTENDANCE_FETCH_ERROR', error.message);
    }
};

// @desc    Save/Update student attendance
// @route   POST /api/schooladmin/student-attendance
// @access  Private (SchoolAdmin only)
const saveStudentAttendance = async (req, res) => {
    try {
        let school_id;
        try {
            school_id = await getSchoolId(req.user._id);
        } catch (schoolErr) {
            return sendErrorResponse(res, 404, 'School not found for this administrator account', 'SCHOOL_NOT_FOUND', schoolErr.message);
        }

        const { class_id, date, records, academic_year } = req.body;

        if (!class_id || !date || !records) {
            return sendErrorResponse(res, 400, 'Class ID, Date, and Records are required', 'MISSING_REQUIRED_FIELDS');
        }

        if (!mongoose.Types.ObjectId.isValid(class_id)) {
            return sendErrorResponse(res, 400, 'Invalid class_id format', 'INVALID_CLASS_ID');
        }

        if (!Array.isArray(records)) {
            return sendErrorResponse(res, 400, 'Records must be an array of student attendance items', 'INVALID_RECORDS_FORMAT');
        }

        const queryDate = parseAndNormalizeDate(date);
        if (!queryDate) {
            return sendErrorResponse(res, 400, 'Invalid date format. Please provide a valid date string (e.g. YYYY-MM-DD)', 'INVALID_DATE_FORMAT');
        }

        // Validate that class belongs to this school
        const classDoc = await Class.findOne({ _id: class_id, school_id });
        if (!classDoc) {
            return sendErrorResponse(res, 404, 'Class not found in this school', 'CLASS_NOT_FOUND');
        }

        // Sanitize and validate record entries
        const allowedStatuses = ['Present', 'Absent', 'Leave', 'Late', 'Half Day', 'Holiday'];
        const sanitizedRecords = records.map((r, idx) => {
            if (!r.student_id || !mongoose.Types.ObjectId.isValid(r.student_id)) {
                throw new Error(`Record at index ${idx} has an invalid or missing student_id`);
            }
            return {
                student_id: r.student_id,
                name: r.name || 'Student',
                admission_number: r.admission_number || '',
                roll_no: r.roll_no || '',
                status: allowedStatuses.includes(r.status) ? r.status : 'Present',
                remarks: r.remarks || ''
            };
        });

        const updateData = {
            school_id,
            class_id,
            date: queryDate,
            records: sanitizedRecords,
            updated_by: req.user._id
        };
        if (academic_year) {
            updateData.academic_year = academic_year;
        }

        const attendance = await StudentAttendance.findOneAndUpdate(
            { school_id, class_id, date: queryDate },
            {
                $set: updateData,
                $setOnInsert: { created_by: req.user._id }
            },
            { new: true, upsert: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Attendance saved successfully',
            attendance,
            data: {
                attendance,
                records: sanitizedRecords,
                totalRecords: sanitizedRecords.length
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return sendErrorResponse(res, 422, 'Validation error while saving student attendance', 'ATTENDANCE_VALIDATION_ERROR', error.message);
        }
        return sendErrorResponse(res, 500, 'Server error while saving student attendance', 'ATTENDANCE_SAVE_ERROR', error.message);
    }
};

// @desc    Get student attendance report (Month-wise, Week-wise, or Individual)
// @route   GET /api/schooladmin/student-attendance/report
// @access  Private (SchoolAdmin only)
const getStudentAttendanceReport = async (req, res) => {
    try {
        let school_id;
        try {
            school_id = await getSchoolId(req.user._id);
        } catch (schoolErr) {
            return sendErrorResponse(res, 404, 'School not found for this administrator account', 'SCHOOL_NOT_FOUND', schoolErr.message);
        }

        const { class_id, month, year, week_start, student_id } = req.query;

        if (!class_id) {
            return sendErrorResponse(res, 400, 'Class ID parameter is required', 'MISSING_CLASS_ID');
        }

        if (!mongoose.Types.ObjectId.isValid(class_id)) {
            return sendErrorResponse(res, 400, 'Invalid class_id parameter format', 'INVALID_CLASS_ID');
        }

        let startDate, endDate;

        if (month && year) {
            const m = parseInt(month, 10) - 1;
            const y = parseInt(year, 10);
            if (isNaN(m) || m < 0 || m > 11 || isNaN(y) || y < 2000) {
                return sendErrorResponse(res, 400, 'Invalid month or year parameters', 'INVALID_MONTH_YEAR');
            }
            startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
            endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        } else if (week_start) {
            startDate = parseAndNormalizeDate(week_start);
            if (!startDate) {
                return sendErrorResponse(res, 400, 'Invalid week_start date format. Expected YYYY-MM-DD.', 'INVALID_WEEK_START');
            }
            endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 6);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return sendErrorResponse(res, 400, 'Either month/year or week_start parameter is required', 'MISSING_DATE_RANGE');
        }

        // Fetch attendance records in date range for this class
        const attendanceDocs = await StudentAttendance.find({
            school_id,
            class_id,
            date: { $gte: startDate, $lte: endDate }
        });

        if (student_id) {
            if (!mongoose.Types.ObjectId.isValid(student_id)) {
                return sendErrorResponse(res, 400, 'Invalid student_id parameter format', 'INVALID_STUDENT_ID');
            }

            // Individual Student Report
            const records = [];
            const curDate = new Date(startDate);
            while (curDate <= endDate) {
                const doc = attendanceDocs.find(d => {
                    const d1 = new Date(d.date).toISOString().split('T')[0];
                    const d2 = curDate.toISOString().split('T')[0];
                    return d1 === d2;
                });

                let status = 'N/A';

                if (doc) {
                    const rec = doc.records.find(r => r.student_id && r.student_id.toString() === student_id.toString());
                    if (rec) {
                        status = rec.status;
                    }
                }

                records.push({
                    date: new Date(curDate),
                    status
                });

                curDate.setUTCDate(curDate.getUTCDate() + 1);
            }

            return res.status(200).json({
                success: true,
                message: 'Individual student attendance report retrieved successfully',
                student_id,
                startDate,
                endDate,
                records,
                data: {
                    student_id,
                    startDate,
                    endDate,
                    records,
                    totalRecords: records.length
                }
            });
        } else {
            // Class overview report
            const students = await Student.find({ school_id, class_id }).select('student_name roll_no admission_number');
            
            const summary = students.map(s => {
                let present = 0;
                let absent = 0;

                attendanceDocs.forEach(doc => {
                    const rec = doc.records.find(r => r.student_id && r.student_id.toString() === s._id.toString());
                    if (rec) {
                        if (rec.status === 'Present') present++;
                        else if (rec.status === 'Absent') absent++;
                    }
                });

                const total = present + absent;
                const rate = total > 0 ? Math.round((present / total) * 100) : 0;

                return {
                    student_id: s._id,
                    name: s.student_name,
                    roll_no: s.roll_no || '',
                    admission_number: s.admission_number || s._id.toString().substring(0, 16).toUpperCase(),
                    present,
                    absent,
                    rate
                };
            });

            return res.status(200).json({
                success: true,
                message: 'Student attendance class overview report retrieved successfully',
                startDate,
                endDate,
                summary,
                data: {
                    startDate,
                    endDate,
                    summary,
                    totalRecords: summary.length
                }
            });
        }
    } catch (error) {
        return sendErrorResponse(res, 500, 'Server error while generating student attendance report', 'ATTENDANCE_REPORT_ERROR', error.message);
    }
};

module.exports = {
    getStaffAttendance,
    saveStaffAttendance,
    getStaffAttendanceReport,
    getStudentAttendance,
    saveStudentAttendance,
    getStudentAttendanceReport
};
