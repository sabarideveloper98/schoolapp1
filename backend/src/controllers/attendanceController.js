const Teacher = require('../models/Teacher');
const Staff = require('../models/Staff');
const School = require('../models/School');
const StaffAttendance = require('../models/StaffAttendance');
const Student = require('../models/Student');
const StudentAttendance = require('../models/StudentAttendance');

const getSchoolId = async (adminId) => {
    const school = await School.findOne({ admin_id: adminId });
    if (!school) throw new Error('School not found for this admin');
    return school._id;
};

// Normalize date to UTC start of day
const normalizeDate = (dateStr) => {
    const d = new Date(dateStr);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

// @desc    Get staff attendance list by date and role
// @route   GET /api/schooladmin/attendance
// @access  Private (SchoolAdmin only)
const getStaffAttendance = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { role, date } = req.query;

        if (!role || !date) {
            return res.status(400).json({ message: 'Role and Date parameters are required' });
        }

        const queryDate = normalizeDate(date);

        // Find existing attendance
        let attendance = await StaffAttendance.findOne({
            school_id,
            role_filter: role,
            date: queryDate
        });

        if (attendance) {
            return res.json(attendance);
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
                out_time: '05:00 PM'
            }));
        } else if (role === 'Staff') {
            const staff = await Staff.find({ school_id });
            records = staff.map(s => ({
                user_id: s.user_id,
                name: s.name,
                role: 'Staff',
                status: 'Present',
                in_time: '09:00 AM',
                out_time: '05:00 PM'
            }));
        }

        res.json({
            school_id,
            date: queryDate,
            role_filter: role,
            records,
            notify_via: 'Do not send'
        });
    } catch (error) {
        console.error(error);
        res.status(550).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Save/Update staff attendance records
// @route   POST /api/schooladmin/attendance
// @access  Private (SchoolAdmin only)
const saveStaffAttendance = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { role, date, records, notify_via } = req.body;

        if (!role || !date || !records) {
            return res.status(400).json({ message: 'Role, Date, and Records are required' });
        }

        const queryDate = normalizeDate(date);

        const attendance = await StaffAttendance.findOneAndUpdate(
            { school_id, date: queryDate, role_filter: role },
            {
                school_id,
                date: queryDate,
                role_filter: role,
                records,
                notify_via: notify_via || 'Do not send'
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            attendance,
            message: 'Attendance saved successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get staff attendance report (Month-wise, Week-wise, or Individual)
// @route   GET /api/schooladmin/attendance/report
// @access  Private (SchoolAdmin only)
const getStaffAttendanceReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { role, month, year, week_start, user_id } = req.query;

        let startDate, endDate;

        if (month && year) {
            // Month-wise
            const m = parseInt(month) - 1; // 0-indexed
            const y = parseInt(year);
            startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
            endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        } else if (week_start) {
            // Week-wise
            startDate = new Date(week_start);
            startDate.setUTCHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 6);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ message: 'Either month/year or week_start is required' });
        }

        // Fetch attendance records in date range
        const attendanceDocs = await StaffAttendance.find({
            school_id,
            date: { $gte: startDate, $lte: endDate }
        });

        if (user_id) {
            // Individual Staff Report
            // Fetch date-by-date attendance for this user
            const records = [];
            
            // Loop through all dates in range
            const curDate = new Date(startDate);
            while (curDate <= endDate) {
                // Find doc for this specific date
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
                        in_time = rec.in_time;
                        out_time = rec.out_time;
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

            return res.json({
                user_id,
                startDate,
                endDate,
                records
            });
        } else {
            // Overview (List of all staff with present/absent counts)
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
                    // Check if role filter matches (if requested)
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

            return res.json({
                startDate,
                endDate,
                summary
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get student attendance by date and class
// @route   GET /api/schooladmin/student-attendance
// @access  Private (SchoolAdmin only)
const getStudentAttendance = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, date } = req.query;

        if (!class_id || !date) {
            return res.status(400).json({ message: 'Class ID and Date parameters are required' });
        }

        const queryDate = normalizeDate(date);
        const school = await School.findById(school_id);

        let attendance = await StudentAttendance.findOne({
            school_id,
            class_id,
            date: queryDate
        });

        if (attendance) {
            return res.json({
                school_name: school ? school.name : 'School',
                attendance
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
            status: 'Present'
        }));

        res.json({
            school_name: school ? school.name : 'School',
            attendance: {
                school_id,
                class_id,
                date: queryDate,
                records
            }
        });
    } catch (error) {
        console.error(error);
        res.status(550).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Save/Update student attendance
// @route   POST /api/schooladmin/student-attendance
// @access  Private (SchoolAdmin only)
const saveStudentAttendance = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, date, records } = req.body;

        if (!class_id || !date || !records) {
            return res.status(400).json({ message: 'Class ID, Date, and Records are required' });
        }

        const queryDate = normalizeDate(date);

        const attendance = await StudentAttendance.findOneAndUpdate(
            { school_id, class_id, date: queryDate },
            {
                school_id,
                class_id,
                date: queryDate,
                records
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            attendance,
            message: 'Attendance saved successfully'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get student attendance report (Month-wise, Week-wise, or Individual)
// @route   GET /api/schooladmin/student-attendance/report
// @access  Private (SchoolAdmin only)
const getStudentAttendanceReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { class_id, month, year, week_start, student_id } = req.query;

        if (!class_id) {
            return res.status(400).json({ message: 'Class ID parameter is required' });
        }

        let startDate, endDate;

        if (month && year) {
            const m = parseInt(month) - 1;
            const y = parseInt(year);
            startDate = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
            endDate = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
        } else if (week_start) {
            startDate = new Date(week_start);
            startDate.setUTCHours(0, 0, 0, 0);
            endDate = new Date(startDate);
            endDate.setUTCDate(startDate.getUTCDate() + 6);
            endDate.setUTCHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ message: 'Either month/year or week_start is required' });
        }

        // Fetch attendance records in date range for this class
        const attendanceDocs = await StudentAttendance.find({
            school_id,
            class_id,
            date: { $gte: startDate, $lte: endDate }
        });

        if (student_id) {
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

            return res.json({
                student_id,
                startDate,
                endDate,
                records
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

            return res.json({
                startDate,
                endDate,
                summary
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
