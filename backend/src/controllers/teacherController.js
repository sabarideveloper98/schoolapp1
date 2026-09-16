const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const ClassSubject = require('../models/ClassSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Message = require('../models/Message');
const StudentAttendance = require('../models/StudentAttendance');
const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const Exam = require('../models/Exam');
const ExamMark = require('../models/ExamMark');
const TeacherLeave = require('../models/TeacherLeave');
const StudentRemark = require('../models/StudentRemark');
const StudyMaterial = require('../models/StudyMaterial');
const Notice = require('../models/Notice');
const Query = require('../models/Query');
const TimetableEntry = require('../models/TimetableEntry');
const Timetable = require('../models/Timetable');
const StudentTransport = require('../models/StudentTransport');
const Route = require('../models/Route');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Notification = require('../models/Notification');
const bcrypt = require('bcryptjs');

// Helper to get teacher profile
const getTeacherProfileHelper = async (userId) => {
    let teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher) {
        // Fallback: search by _id if user is directly a teacher document
        teacher = await Teacher.findById(userId);
    }
    if (!teacher) throw new Error('Teacher profile not found');
    return teacher;
};

// Helper to get all class IDs assigned to teacher (either incharge or subject teacher)
const getTeacherClassIdsHelper = async (teacherId, schoolId) => {
    const inchargeClasses = await Class.find({ school_id: schoolId, class_incharge_id: teacherId });
    const inchargeIds = inchargeClasses.map(c => c._id.toString());

    const assignments = await TeacherAssignment.find({ school_id: schoolId, teacher_id: teacherId });
    const assignmentIds = assignments.map(a => a.class_id.toString());

    const classSubjects = await ClassSubject.find({ teacher_id: teacherId });
    const csIds = classSubjects.map(cs => cs.class_id.toString());

    return [...new Set([...inchargeIds, ...assignmentIds, ...csIds])];
};

// @desc    Get Teacher Dashboard Stats
// @route   GET /api/teacher/dashboard-stats
// @access  Private (Teacher only)
const getDashboardStats = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const schoolId = teacher.school_id;
        const teacherId = teacher._id;

        const classIds = await getTeacherClassIdsHelper(teacherId, schoolId);

        const totalStudents = await Student.countDocuments({ class_id: { $in: classIds } });
        const assignedClassesCount = classIds.length;

        // Today's classes schedule count from Timetable / TimetableEntry
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDay = days[new Date().getDay()];

        const todayEntries = await TimetableEntry.find({ teacher_id: teacherId, day: todayDay });
        
        // Pending attendance check for today
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const tomorrowDate = new Date(todayDate);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);

        const attendanceTakenCount = await StudentAttendance.countDocuments({
            school_id: schoolId,
            class_id: { $in: classIds },
            date: { $gte: todayDate, $lt: tomorrowDate }
        });

        const pendingAttendanceCount = Math.max(0, assignedClassesCount - attendanceTakenCount);

        // Pending Homework count
        const pendingHomeworkCount = await Homework.countDocuments({
            school_id: schoolId,
            teacher_id: teacherId,
            due_date: { $gte: todayDate }
        });

        // Upcoming Exams count
        const upcomingExamsCount = await Exam.countDocuments({
            school_id: schoolId,
            class_id: { $in: classIds }
        });

        // Unread parent queries / messages
        const unreadQueriesCount = await Query.countDocuments({
            school_id: schoolId,
            assigned_teacher_id: teacherId,
            status: { $ne: 'Resolved' }
        });

        // Latest announcements / notices
        const latestAnnouncements = await Notice.find({ school_id: schoolId })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            assignedClassesCount,
            totalStudents,
            todaysClassesCount: todayEntries.length,
            todaysClasses: todayEntries,
            pendingAttendanceCount,
            pendingHomeworkCount,
            upcomingExamsCount,
            unreadQueriesCount,
            latestAnnouncements
        });
    } catch (error) {
        console.error('getDashboardStats error:', error);
        res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
    }
};

// @desc    Get Teacher Profile
// @route   GET /api/teacher/profile
// @access  Private (Teacher only)
const getProfile = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ user_id: req.user._id })
            .populate('school_id', 'name code email logo')
            .populate('user_id', 'email phone role');

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }

        // Get incharge classes
        const inchargeClasses = await Class.find({ class_incharge_id: teacher._id });

        // Get subject assignments
        const assignments = await TeacherAssignment.find({ teacher_id: teacher._id })
            .populate('class_id', 'class section')
            .populate('subject_id', 'name code');

        res.json({
            teacher,
            inchargeClasses,
            assignments,
            isClassIncharge: inchargeClasses.length > 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
};

// @desc    Update Teacher Profile
// @route   PUT /api/teacher/profile
// @access  Private (Teacher only)
const updateProfile = async (req, res) => {
    try {
        const { qualification, experience, photo, phone } = req.body;
        const teacher = await Teacher.findOne({ user_id: req.user._id });
        if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

        if (qualification !== undefined) teacher.qualification = qualification;
        if (experience !== undefined) teacher.experience = experience;
        if (photo !== undefined) teacher.photo = photo;
        if (phone !== undefined) teacher.phone = phone;

        await teacher.save();

        if (phone && req.user._id) {
            await User.findByIdAndUpdate(req.user._id, { phone });
        }

        res.json({ message: 'Profile updated successfully', teacher });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
};

// @desc    Change Password
// @route   PUT /api/teacher/change-password
// @access  Private (Teacher only)
const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ message: 'Old and new passwords are required' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(new_password, salt);
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};

// @desc    Get all students assigned to the teacher
// @route   GET /api/teacher/students
// @access  Private (Teacher only)
const getStudents = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const classIds = await getTeacherClassIdsHelper(teacher._id, teacher.school_id);

        let filter = { class_id: { $in: classIds } };
        if (req.query.class_id) {
            filter.class_id = req.query.class_id;
        }

        const students = await Student.find(filter)
            .populate('class_id', 'class section')
            .populate('parent_user_id', 'email phone');

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get detailed Student Profile (Personal, Parent, Attendance, Academic Results, Transport)
// @route   GET /api/teacher/students/:id
// @access  Private (Teacher only)
const getStudentDetails = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('class_id')
            .populate('parent_user_id');

        if (!student) return res.status(404).json({ message: 'Student not found' });

        // Attendance history
        const attendance = await StudentAttendance.find({ student_id: student._id }).sort({ date: -1 });

        // Exam Marks
        const marks = await ExamMark.find({ student_id: student._id })
            .populate('exam_id')
            .populate('subject_id');

        // Homework status
        const homeworkSubmissions = await HomeworkSubmission.find({ student_id: student._id })
            .populate('homework_id');

        // Transport Info
        const transport = await StudentTransport.findOne({ student_id: student._id })
            .populate('route_id')
            .populate('stop_id')
            .populate('bus_id');

        // Remarks
        const remarks = await StudentRemark.find({ student_id: student._id })
            .populate('teacher_id', 'name');

        res.json({
            student,
            attendance,
            marks,
            homeworkSubmissions,
            transport,
            remarks
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student details', error: error.message });
    }
};

// @desc    Create a student (and parent account) if teacher is class incharge
// @route   POST /api/teacher/students
// @access  Private (Teacher only)
const createStudent = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { 
            student_name, age, address, dob, blood_group, photo,
            parent_name, parent_phone, parent_email, class_id 
        } = req.body;

        const targetClass = await Class.findOne({ _id: class_id, class_incharge_id: teacher._id });
        if (!targetClass) {
            return res.status(403).json({ message: 'Not authorized to add student to this class (Must be Class Incharge)' });
        }

        let parentUser = await User.findOne({ phone: parent_phone });
        let parentPassword = null;

        if (!parentUser) {
            parentPassword = `${parent_name.replace(/\s+/g, '')}@123`;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(parentPassword, salt);
            parentUser = await User.create({
                phone: parent_phone,
                email: parent_email,
                password: hashedPassword,
                role: 'Parent',
                school_id: teacher.school_id
            });
        }

        const student = await Student.create({
            student_name, age, address, dob, blood_group, photo,
            parent_name, parent_phone, parent_email,
            class_id,
            school_id: teacher.school_id,
            parent_user_id: parentUser._id
        });

        res.status(201).json({
            student,
            parentPassword,
            message: 'Student and Parent account created successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update Student Info
// @route   PUT /api/teacher/students/:id
// @access  Private (Teacher only)
const updateStudentDetails = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const targetClass = await Class.findOne({ _id: student.class_id, class_incharge_id: teacher._id });
        if (!targetClass) {
            return res.status(403).json({ message: 'Not authorized to edit student info for this class' });
        }

        const updated = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ message: 'Student information updated successfully', student: updated });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update student', error: error.message });
    }
};

// @desc    Get all classes assigned to the teacher (either incharge or teaching a subject)
// @route   GET /api/teacher/classes
// @access  Private (Teacher only)
const getClasses = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);

        const inchargeClasses = await Class.find({ class_incharge_id: teacher._id }).lean();
        const assignments = await TeacherAssignment.find({ teacher_id: teacher._id }).populate('subject_id').populate('class_id').lean();
        const classSubjects = await ClassSubject.find({ teacher_id: teacher._id }).populate('subject_id').populate('class_id').lean();

        const classMap = {};

        inchargeClasses.forEach(c => {
            classMap[c._id] = {
                _id: c._id,
                class: c.class,
                section: c.section,
                no_student: c.no_student || 0,
                isIncharge: true,
                subjects: []
            };
        });

        const processSubjectSlot = (clsObj, subjObj) => {
            if (!clsObj) return;
            const classId = clsObj._id.toString();
            if (!classMap[classId]) {
                classMap[classId] = {
                    _id: clsObj._id,
                    class: clsObj.class,
                    section: clsObj.section,
                    no_student: clsObj.no_student || 0,
                    isIncharge: false,
                    subjects: []
                };
            }
            if (subjObj && !classMap[classId].subjects.some(s => s._id.toString() === subjObj._id.toString())) {
                classMap[classId].subjects.push({
                    _id: subjObj._id,
                    name: subjObj.name,
                    code: subjObj.code
                });
            }
        };

        assignments.forEach(a => processSubjectSlot(a.class_id, a.subject_id));
        classSubjects.forEach(cs => processSubjectSlot(cs.class_id, cs.subject_id));

        // Get actual student counts
        for (const cid in classMap) {
            const count = await Student.countDocuments({ class_id: cid });
            classMap[cid].studentCount = count;
        }

        res.json(Object.values(classMap));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Mark / Save Daily & Subject-wise Attendance
// @route   POST /api/teacher/attendance
// @access  Private (Teacher only)
const markAttendance = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { class_id, date, records, subject_id } = req.body;

        if (!class_id || !records || !Array.isArray(records)) {
            return res.status(400).json({ message: 'class_id and records array are required' });
        }

        const attDate = date ? new Date(date) : new Date();
        attDate.setHours(0, 0, 0, 0);

        const savedDocs = [];
        for (const rec of records) {
            const doc = await StudentAttendance.findOneAndUpdate(
                {
                    school_id: teacher.school_id,
                    student_id: rec.student_id,
                    class_id,
                    date: attDate,
                    ...(subject_id ? { subject_id } : {})
                },
                {
                    school_id: teacher.school_id,
                    student_id: rec.student_id,
                    class_id,
                    subject_id: subject_id || null,
                    date: attDate,
                    status: rec.status || 'Present', // Present, Absent, Leave, Half Day
                    remarks: rec.remarks || ''
                },
                { upsert: true, new: true }
            );
            savedDocs.push(doc);
        }

        res.json({ message: 'Attendance recorded successfully', count: savedDocs.length });
    } catch (error) {
        res.status(500).json({ message: 'Failed to record attendance', error: error.message });
    }
};

// @desc    Get Attendance Reports (Daily, Monthly, Class-wise, Student-wise)
// @route   GET /api/teacher/attendance/report
// @access  Private (Teacher only)
const getAttendanceReport = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { class_id, month, year, student_id } = req.query;

        let query = { school_id: teacher.school_id };
        if (class_id) query.class_id = class_id;
        if (student_id) query.student_id = student_id;

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const records = await StudentAttendance.find(query)
            .populate('student_id', 'student_name roll_no')
            .populate('class_id', 'class section')
            .sort({ date: -1 });

        // Calculate summary statistics
        const stats = {
            total: records.length,
            present: records.filter(r => r.status === 'Present').length,
            absent: records.filter(r => r.status === 'Absent').length,
            leave: records.filter(r => r.status === 'Leave').length,
            halfDay: records.filter(r => r.status === 'Half Day').length
        };

        res.json({ records, stats });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch attendance report', error: error.message });
    }
};

// @desc    Exam & Marks Entry and Rank List
// @route   GET /api/teacher/exams
// @access  Private (Teacher only)
const getExams = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const exams = await Exam.find({ school_id: teacher.school_id }).sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch exams', error: error.message });
    }
};

// @desc    Get / Bulk Save Exam Marks & Rank List
// @route   POST /api/teacher/marks
// @access  Private (Teacher only)
const saveExamMarks = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { exam_id, class_id, subject_id, marks } = req.body;

        if (!exam_id || !class_id || !subject_id || !marks || !Array.isArray(marks)) {
            return res.status(400).json({ message: 'exam_id, class_id, subject_id, and marks array are required' });
        }

        const savedMarks = [];
        for (const item of marks) {
            const doc = await ExamMark.findOneAndUpdate(
                {
                    school_id: teacher.school_id,
                    exam_id,
                    class_id,
                    subject_id,
                    student_id: item.student_id
                },
                {
                    school_id: teacher.school_id,
                    exam_id,
                    class_id,
                    subject_id,
                    student_id: item.student_id,
                    marks_obtained: item.marks_obtained,
                    max_marks: item.max_marks || 100,
                    grade: item.grade || 'A',
                    remarks: item.remarks || ''
                },
                { upsert: true, new: true }
            );
            savedMarks.push(doc);
        }

        res.json({ message: 'Exam marks saved successfully', count: savedMarks.length });
    } catch (error) {
        res.status(500).json({ message: 'Failed to save exam marks', error: error.message });
    }
};

// @desc    Get Exam Marks Report & Rank List
// @route   GET /api/teacher/marks/report
// @access  Private (Teacher only)
const getMarksReport = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { exam_id, class_id, subject_id } = req.query;

        let query = { school_id: teacher.school_id };
        if (exam_id) query.exam_id = exam_id;
        if (class_id) query.class_id = class_id;
        if (subject_id) query.subject_id = subject_id;

        const marks = await ExamMark.find(query)
            .populate('student_id', 'student_name roll_no')
            .populate('subject_id', 'name code')
            .populate('exam_id', 'name');

        // Rank list calculation per student if class_id & exam_id are provided
        const studentTotals = {};
        marks.forEach(m => {
            const sid = m.student_id?._id?.toString() || m.student_id?.toString();
            if (!sid) return;
            if (!studentTotals[sid]) {
                studentTotals[sid] = {
                    student_id: m.student_id,
                    totalObtained: 0,
                    totalMax: 0,
                    marksList: []
                };
            }
            studentTotals[sid].totalObtained += (m.marks_obtained || 0);
            studentTotals[sid].totalMax += (m.max_marks || 100);
            studentTotals[sid].marksList.push(m);
        });

        const rankList = Object.values(studentTotals)
            .map(s => ({
                ...s,
                percentage: s.totalMax > 0 ? ((s.totalObtained / s.totalMax) * 100).toFixed(2) : 0
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .map((item, index) => ({ ...item, rank: index + 1 }));

        res.json({ marks, rankList });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch marks report', error: error.message });
    }
};

// @desc    Study Materials & Notes Management
// @route   GET /api/teacher/materials
// @access  Private (Teacher only)
const getStudyMaterials = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const materials = await StudyMaterial.find({ teacher_id: teacher._id })
            .populate('class_id', 'class section')
            .populate('subject_id', 'name code')
            .sort({ createdAt: -1 });

        res.json(materials);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch study materials', error: error.message });
    }
};

const uploadStudyMaterial = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { title, description, file_url, file_type, class_id, subject_id, target_type, student_ids } = req.body;

        const material = await StudyMaterial.create({
            title,
            description,
            file_url,
            file_type,
            class_id,
            subject_id,
            teacher_id: teacher._id,
            school_id: teacher.school_id,
            target_type,
            student_ids
        });

        res.status(201).json({ message: 'Study material uploaded successfully', material });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload study material', error: error.message });
    }
};

const deleteStudyMaterial = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        await StudyMaterial.findOneAndDelete({ _id: req.params.id, teacher_id: teacher._id });
        res.json({ message: 'Study material deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete study material', error: error.message });
    }
};

// @desc    Leave Management
// @route   GET /api/teacher/leaves
// @access  Private (Teacher only)
const getLeaves = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const leaves = await TeacherLeave.find({ teacher_id: teacher._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch leave records', error: error.message });
    }
};

const applyLeave = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { leave_type, start_date, end_date, reason } = req.body;

        const leave = await TeacherLeave.create({
            teacher_id: teacher._id,
            school_id: teacher.school_id,
            leave_type,
            start_date,
            end_date,
            reason
        });

        res.status(201).json({ message: 'Leave application submitted successfully', leave });
    } catch (error) {
        res.status(500).json({ message: 'Failed to apply leave', error: error.message });
    }
};

const cancelLeave = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const leave = await TeacherLeave.findOne({ _id: req.params.id, teacher_id: teacher._id, status: 'Pending' });

        if (!leave) {
            return res.status(404).json({ message: 'Pending leave request not found or already processed' });
        }

        await TeacherLeave.findByIdAndDelete(req.params.id);
        res.json({ message: 'Leave application cancelled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to cancel leave', error: error.message });
    }
};

// @desc    Student Behaviour & Remarks
// @route   GET /api/teacher/remarks
// @access  Private (Teacher only)
const getRemarks = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const remarks = await StudentRemark.find({ teacher_id: teacher._id })
            .populate('student_id', 'student_name roll_no')
            .populate('class_id', 'class section')
            .sort({ createdAt: -1 });

        res.json(remarks);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch remarks', error: error.message });
    }
};

const addRemark = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { student_id, class_id, type, title, description } = req.body;

        const remark = await StudentRemark.create({
            student_id,
            class_id,
            teacher_id: teacher._id,
            school_id: teacher.school_id,
            type,
            title,
            description
        });

        res.status(201).json({ message: 'Remark added successfully', remark });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add remark', error: error.message });
    }
};

const deleteRemark = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        await StudentRemark.findOneAndDelete({ _id: req.params.id, teacher_id: teacher._id });
        res.json({ message: 'Remark deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete remark', error: error.message });
    }
};

// @desc    Parent Communication & Notices
// @route   GET /api/teacher/queries
// @access  Private (Teacher only)
const getQueries = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const queries = await Query.find({ school_id: teacher.school_id })
            .populate('student_id', 'student_name')
            .populate('parent_id', 'email phone')
            .sort({ createdAt: -1 });

        res.json(queries);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch parent queries', error: error.message });
    }
};

const replyQuery = async (req, res) => {
    try {
        const { response } = req.body;
        const query = await Query.findByIdAndUpdate(
            req.params.id,
            { response, status: 'Resolved' },
            { new: true }
        );
        res.json({ message: 'Reply sent successfully', query });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reply to query', error: error.message });
    }
};

const getNotices = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const notices = await Notice.find({ teacher_id: teacher._id })
            .populate('class_id', 'class section')
            .sort({ createdAt: -1 });

        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notices', error: error.message });
    }
};

const sendNotice = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { title, message, type, class_id, target_type, student_ids } = req.body;

        const notice = await Notice.create({
            title,
            message,
            type,
            class_id,
            teacher_id: teacher._id,
            school_id: teacher.school_id,
            target_type,
            student_ids
        });

        res.status(201).json({ message: 'Notice sent successfully', notice });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send notice', error: error.message });
    }
};

// @desc    Read-only Transport Details for Assigned Students
// @route   GET /api/teacher/transport
// @access  Private (Teacher only)
const getTransportDetails = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const classIds = await getTeacherClassIdsHelper(teacher._id, teacher.school_id);
        const students = await Student.find({ class_id: { $in: classIds } });
        const studentIds = students.map(s => s._id);

        const transportRecords = await StudentTransport.find({ student_id: { $in: studentIds } })
            .populate('student_id', 'student_name roll_no class_id')
            .populate('route_id')
            .populate('bus_id')
            .populate('driver_id');

        res.json(transportRecords);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transport details', error: error.message });
    }
};

// @desc    Read-only School Announcements
// @route   GET /api/teacher/announcements
// @access  Private (Teacher only)
const getAnnouncements = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const notices = await Notice.find({ school_id: teacher.school_id }).sort({ createdAt: -1 });
        res.json(notices);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
    }
};

// @desc    Teacher Analytics Reports
// @route   GET /api/teacher/reports
// @access  Private (Teacher only)
const getTeacherReports = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const classIds = await getTeacherClassIdsHelper(teacher._id, teacher.school_id);

        const totalStudents = await Student.countDocuments({ class_id: { $in: classIds } });
        const totalHomeworks = await Homework.countDocuments({ teacher_id: teacher._id });
        const totalMaterials = await StudyMaterial.countDocuments({ teacher_id: teacher._id });
        const totalNotices = await Notice.countDocuments({ teacher_id: teacher._id });
        const totalRemarks = await StudentRemark.countDocuments({ teacher_id: teacher._id });

        const attendanceRecords = await StudentAttendance.find({ school_id: teacher.school_id, class_id: { $in: classIds } });
        const attendanceStats = {
            present: attendanceRecords.filter(a => a.status === 'Present').length,
            absent: attendanceRecords.filter(a => a.status === 'Absent').length,
            leave: attendanceRecords.filter(a => a.status === 'Leave').length,
            halfDay: attendanceRecords.filter(a => a.status === 'Half Day').length,
        };

        res.json({
            totalStudents,
            totalHomeworks,
            totalMaterials,
            totalNotices,
            totalRemarks,
            attendanceStats
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch teacher reports', error: error.message });
    }
};

// @desc    Notifications
// @route   GET /api/teacher/notifications
// @access  Private (Teacher only)
const getNotifications = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const notifications = await Notification.find({
            $or: [
                { user_id: req.user._id },
                { school_id: teacher.school_id, target_role: 'Teacher' }
            ]
        }).sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};

// @desc    Send a message (single or group)
// @route   POST /api/teacher/messages
// @access  Private (Teacher only)
const sendMessage = async (req, res) => {
    try {
        const teacher = await getTeacherProfileHelper(req.user._id);
        const { title, message, receiver_type, receiver_ids } = req.body;

        if (!['Class', 'Student'].includes(receiver_type)) {
            return res.status(400).json({ message: 'Invalid receiver type' });
        }

        const newMessage = await Message.create({
            title,
            message,
            sender_id: req.user._id,
            school_id: teacher.school_id,
            receiver_type,
            receiver_ids
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get sent messages
// @route   GET /api/teacher/messages
// @access  Private (Teacher only)
const getSentMessages = async (req, res) => {
    try {
        const messages = await Message.find({ sender_id: req.user._id })
            .sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getDashboardStats,
    getProfile,
    updateProfile,
    changePassword,
    getStudents,
    getStudentDetails,
    createStudent,
    updateStudentDetails,
    getClasses,
    markAttendance,
    getAttendanceReport,
    getExams,
    saveExamMarks,
    getMarksReport,
    getStudyMaterials,
    uploadStudyMaterial,
    deleteStudyMaterial,
    getLeaves,
    applyLeave,
    cancelLeave,
    getRemarks,
    addRemark,
    deleteRemark,
    getQueries,
    replyQuery,
    getNotices,
    sendNotice,
    getTransportDetails,
    getAnnouncements,
    getTeacherReports,
    getNotifications,
    sendMessage,
    getSentMessages
};
