const mongoose = require('mongoose');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const ClassSubject = require('../models/ClassSubject');
const TeacherAssignment = require('../models/TeacherAssignment');
const Teacher = require('../models/Teacher');
const StudentAttendance = require('../models/StudentAttendance');
const Homework = require('../models/Homework');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const TimetableEntry = require('../models/TimetableEntry');
const Exam = require('../models/Exam');
const ExamMark = require('../models/ExamMark');
const StudentFee = require('../models/StudentFee');
const FeePayment = require('../models/FeePayment');
const Notice = require('../models/Notice');
const ParentConversation = require('../models/ParentConversation');
const StudentLeave = require('../models/StudentLeave');
const StudentTransport = require('../models/StudentTransport');
const TripHistory = require('../models/TripHistory');
const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Notification = require('../models/Notification');

// Helper to verify student ownership by parent
const verifyParentStudentOwnership = async (parentUserId, studentId) => {
    const student = await Student.findOne({ _id: studentId, parent_user_id: parentUserId });
    if (!student) {
        const err = new Error('Access forbidden: You can only access details for your linked children.');
        err.statusCode = 403;
        throw err;
    }
    return student;
};

// Helper to calculate academic letter grade
const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
};

// ==========================================
// 1. Parent Profile API
// ==========================================
const getParentProfile = async (req, res) => {
    try {
        let parent = await Parent.findOne({ user_id: req.user._id });
        const linkedStudents = await Student.find({ parent_user_id: req.user._id })
            .populate('class_id', 'class section')
            .populate('school_id', 'name code logo');

        if (!parent && linkedStudents.length > 0) {
            const s = linkedStudents[0];
            parent = await Parent.create({
                user_id: req.user._id,
                school_id: s.school_id ? s.school_id._id : null,
                name: s.parent_name || s.father_name || 'Parent',
                father_name: s.father_name || '',
                mother_name: s.mother_name || '',
                phone: req.user.phone || s.parent_phone || '',
                email: req.user.email || s.parent_email || '',
                address: s.address || s.guardian_address || ''
            });
        }

        res.json({
            parentId: parent ? parent._id : req.user._id,
            userId: req.user._id,
            parentName: parent ? parent.name : (linkedStudents[0]?.parent_name || 'Parent'),
            fatherName: parent ? parent.father_name : (linkedStudents[0]?.father_name || ''),
            motherName: parent ? parent.mother_name : (linkedStudents[0]?.mother_name || ''),
            mobileNumber: req.user.phone || (parent ? parent.phone : ''),
            alternateMobileNumber: parent ? parent.alternate_phone : '',
            email: req.user.email || (parent ? parent.email : ''),
            address: parent ? parent.address : (linkedStudents[0]?.address || ''),
            occupation: parent ? parent.occupation : '',
            linkedStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch parent profile', error: error.message });
    }
};

// ==========================================
// 2. Parent Dashboard API
// ==========================================
const getParentDashboard = async (req, res) => {
    try {
        const children = await Student.find({ parent_user_id: req.user._id })
            .populate('class_id', 'class section')
            .populate('school_id', 'name');

        const totalChildrenCount = children.length;
        const classIds = children.map(c => c.class_id ? c.class_id._id : null).filter(Boolean);
        const studentIds = children.map(c => c._id);

        // Today's attendance summary
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);

        const todayLogs = await StudentAttendance.find({
            student_id: { $in: studentIds },
            date: { $gte: todayStart, $lt: todayEnd }
        });

        const todayAttendanceSummary = children.map(c => {
            const log = todayLogs.find(l => l.student_id.toString() === c._id.toString());
            return {
                studentId: c._id,
                studentName: c.student_name,
                status: log ? log.status : 'Not Marked Yet'
            };
        });

        // Pending Homework Count for linked children's classes
        const pendingHomeworkCount = await Homework.countDocuments({
            class_id: { $in: classIds },
            due_date: { $gte: todayStart }
        });

        // Upcoming Exams Count
        const upcomingExamsCount = await Exam.countDocuments({
            class_ids: { $in: classIds }
        });

        // Unread messages count
        const unreadMessagesCount = await ParentConversation.countDocuments({
            parent_id: req.user._id,
            'messages.read_at': null,
            'messages.sender_id': { $ne: req.user._id }
        });

        // Latest announcements
        const latestAnnouncements = await Notice.find({})
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalChildrenCount,
            todayAttendanceSummary,
            pendingHomeworkCount,
            upcomingExamsCount,
            unreadMessagesCount,
            latestAnnouncements,
            children
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
    }
};

// ==========================================
// 3. Child Management APIs
// ==========================================
const getLinkedStudents = async (req, res) => {
    try {
        const students = await Student.find({ parent_user_id: req.user._id })
            .populate('class_id', 'class section')
            .populate('school_id', 'name code logo');

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch students', error: error.message });
    }
};

const getStudentDetails = async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await verifyParentStudentOwnership(req.user._id, studentId);

        const populatedStudent = await Student.findById(student._id)
            .populate('class_id', 'class section')
            .populate('school_id', 'name code logo email phone location');

        res.json({
            admissionNumber: populatedStudent.admission_number || '',
            name: populatedStudent.student_name,
            firstName: populatedStudent.first_name || '',
            lastName: populatedStudent.last_name || '',
            rollNumber: populatedStudent.roll_no || '',
            class: populatedStudent.class_id ? populatedStudent.class_id.class : '',
            section: populatedStudent.class_id ? populatedStudent.class_id.section : '',
            dateOfBirth: populatedStudent.dob || null,
            bloodGroup: populatedStudent.blood_group || '',
            photo: populatedStudent.photo || '',
            academicInformation: {
                group: populatedStudent.group || 'General',
                registrationNo: populatedStudent.registration_no || '',
                religion: populatedStudent.religion || ''
            },
            parentInformation: {
                fatherName: populatedStudent.father_name || '',
                motherName: populatedStudent.mother_name || '',
                parentName: populatedStudent.parent_name || '',
                parentPhone: populatedStudent.parent_phone || '',
                parentEmail: populatedStudent.parent_email || '',
                guardianRelation: populatedStudent.guardian_relation || 'Parent',
                address: populatedStudent.address || populatedStudent.guardian_address || ''
            },
            student: populatedStudent
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 4. Attendance APIs
// ==========================================
const getAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { filter, month, year, startDate, endDate } = req.query;

        let studentIds = [];
        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            studentIds = [s._id];
        } else {
            const students = await Student.find({ parent_user_id: req.user._id });
            studentIds = students.map(s => s._id);
        }

        let queryDate = {};
        const now = new Date();
        const currentYear = year ? parseInt(year) : now.getFullYear();

        if (filter === 'daily') {
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date(start);
            end.setDate(end.getDate() + 1);
            queryDate = { $gte: start, $lt: end };
        } else if (filter === 'monthly' || month) {
            const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
            const start = new Date(currentYear, targetMonth, 1);
            const end = new Date(currentYear, targetMonth + 1, 1);
            queryDate = { $gte: start, $lt: end };
        } else if (filter === 'academic_year') {
            const start = new Date(currentYear, 5, 1); // June 1st
            const end = new Date(currentYear + 1, 4, 31); // May 31st
            queryDate = { $gte: start, $lt: end };
        } else if (startDate && endDate) {
            queryDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const query = { student_id: { $in: studentIds } };
        if (queryDate.$gte) query.date = queryDate;

        const records = await StudentAttendance.find(query).sort({ date: -1 });

        const presentDays = records.filter(r => r.status === 'Present').length;
        const absentDays = records.filter(r => r.status === 'Absent').length;
        const leaveDays = records.filter(r => r.status === 'Leave' || r.status === 'Late').length;
        const totalDays = records.length;
        const attendancePercentage = totalDays > 0 ? parseFloat(((presentDays / totalDays) * 100).toFixed(2)) : 100;

        res.json({
            presentDays,
            absentDays,
            leaveDays,
            totalDays,
            attendancePercentage,
            records
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 5. Homework APIs
// ==========================================
const getHomework = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { subjectId, startDate, endDate } = req.query;

        let students = [];
        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            students = [s];
        } else {
            students = await Student.find({ parent_user_id: req.user._id });
        }

        const classIds = students.map(s => s.class_id);
        const query = { class_id: { $in: classIds } };

        if (subjectId) query.subject_id = subjectId;
        if (startDate && endDate) {
            query.due_date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const homeworkList = await Homework.find(query)
            .populate('subject_id', 'name code')
            .populate('teacher_id', 'name')
            .sort({ due_date: -1 });

        const studentIds = students.map(s => s._id);
        const submissions = await HomeworkSubmission.find({
            student_id: { $in: studentIds },
            homework_id: { $in: homeworkList.map(h => h._id) }
        });

        const formattedHomework = homeworkList.map(hw => {
            const sub = submissions.find(s => s.homework_id.toString() === hw._id.toString());
            return {
                homeworkId: hw._id,
                homeworkTitle: hw.title,
                subject: hw.subject_id ? hw.subject_id.name : 'Subject',
                description: hw.description || '',
                dueDate: hw.due_date,
                assignedDate: hw.createdAt,
                teacherName: hw.teacher_id ? hw.teacher_id.name : '',
                submissionStatus: sub ? sub.status : 'Pending',
                submittedAt: sub ? sub.createdAt : null,
                marksObtained: sub ? sub.marks_obtained : null
            };
        });

        res.json(formattedHomework);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 6. Timetable APIs
// ==========================================
const getTimetable = async (req, res) => {
    try {
        const { studentId } = req.params;
        let students = [];
        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            students = [s];
        } else {
            students = await Student.find({ parent_user_id: req.user._id });
        }

        const classIds = students.map(s => s.class_id);

        const entries = await TimetableEntry.find({ class_id: { $in: classIds } })
            .populate('subject_id', 'name code')
            .populate('teacher_id', 'name')
            .sort({ day: 1, period: 1 });

        const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        const formattedTimetable = entries.map(entry => ({
            day: entry.day,
            period: entry.period,
            subject: entry.subject_id ? entry.subject_id.name : '',
            teacherName: entry.teacher_id ? entry.teacher_id.name : 'Assigned Teacher',
            startTime: entry.start_time || '',
            endTime: entry.end_time || ''
        }));

        res.json(formattedTimetable);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 7. Exam APIs
// ==========================================
const getExams = async (req, res) => {
    try {
        const { studentId } = req.params;
        let students = [];
        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            students = [s];
        } else {
            students = await Student.find({ parent_user_id: req.user._id });
        }

        const classIds = students.map(s => s.class_id);

        const exams = await Exam.find({ class_ids: { $in: classIds } })
            .sort({ start_date: -1 });

        const formattedExams = exams.map(exam => ({
            examId: exam._id,
            examName: exam.name,
            examType: exam.exam_type || 'Term Exam',
            startDate: exam.start_date,
            endDate: exam.end_date,
            subjects: exam.subjects || [],
            schedule: exam.schedule || []
        }));

        res.json(formattedExams);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 8. Marks & Report Card APIs
// ==========================================
const getResults = async (req, res) => {
    try {
        const { studentId } = req.params;
        let students = [];
        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            students = [s];
        } else {
            students = await Student.find({ parent_user_id: req.user._id });
        }

        const studentIds = students.map(s => s._id);

        const examMarks = await ExamMark.find({ student_id: { $in: studentIds } })
            .populate('exam_id', 'name exam_type start_date')
            .populate('marks.subject_id', 'name code');

        const results = examMarks.map(em => {
            let totalObtained = 0;
            let totalMax = 0;

            const subjectMarks = (em.marks || []).map(m => {
                totalObtained += m.marks_obtained || 0;
                totalMax += m.total_marks || 100;
                return {
                    subjectName: m.subject_id ? m.subject_id.name : 'Subject',
                    marksObtained: m.marks_obtained,
                    totalMarks: m.total_marks,
                    grade: calculateGrade(m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0)
                };
            });

            const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
            const overallGrade = calculateGrade(percentage);
            const resultStatus = percentage >= 40 ? 'Pass' : 'Fail';

            return {
                examId: em.exam_id ? em.exam_id._id : null,
                examName: em.exam_id ? em.exam_id.name : 'Exam',
                studentId: em.student_id,
                subjectWiseMarks: subjectMarks,
                totalMarks: totalMax,
                totalMarksObtained: totalObtained,
                percentage,
                grade: overallGrade,
                resultStatus
            };
        });

        res.json(results);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

const getReportCard = async (req, res) => {
    try {
        const { studentId, examId } = req.params;
        const student = await verifyParentStudentOwnership(req.user._id, studentId);

        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: 'Exam not found' });

        const examMark = await ExamMark.findOne({ student_id: student._id, exam_id: exam._id })
            .populate('marks.subject_id', 'name code');

        // Calculate Rank in Class
        const allMarks = await ExamMark.find({ exam_id: exam._id, class_id: student.class_id });
        const studentScores = allMarks.map(am => {
            const tot = (am.marks || []).reduce((acc, m) => acc + (m.marks_obtained || 0), 0);
            return { student_id: am.student_id.toString(), tot };
        }).sort((a, b) => b.tot - a.tot);

        const rankIndex = studentScores.findIndex(s => s.student_id === student._id.toString());
        const rank = rankIndex >= 0 ? rankIndex + 1 : 'N/A';

        let totalObtained = 0;
        let totalMax = 0;
        const subjectWiseMarks = ((examMark ? examMark.marks : []) || []).map(m => {
            totalObtained += m.marks_obtained || 0;
            totalMax += m.total_marks || 100;
            const pct = m.total_marks > 0 ? (m.marks_obtained / m.total_marks) * 100 : 0;
            return {
                subjectName: m.subject_id ? m.subject_id.name : 'Subject',
                subjectCode: m.subject_id ? m.subject_id.code : '',
                marksObtained: m.marks_obtained,
                totalMarks: m.total_marks,
                percentage: parseFloat(pct.toFixed(2)),
                grade: calculateGrade(pct),
                status: pct >= 35 ? 'Pass' : 'Fail'
            };
        });

        const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

        res.json({
            student: {
                id: student._id,
                name: student.student_name,
                admissionNumber: student.admission_number,
                rollNo: student.roll_no
            },
            exam: {
                id: exam._id,
                name: exam.name,
                type: exam.exam_type
            },
            subjectWiseMarks,
            totalMarks: totalMax,
            totalMarksObtained: totalObtained,
            percentage,
            grade: calculateGrade(percentage),
            rank,
            resultStatus: percentage >= 40 ? 'Pass' : 'Fail'
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 9. Fee APIs (Read-Only)
// ==========================================
const getFees = async (req, res) => {
    try {
        const { studentId } = req.params;
        let students = [];
        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            students = [s];
        } else {
            students = await Student.find({ parent_user_id: req.user._id });
        }

        const studentIds = students.map(s => s._id);

        const feeAssignments = await StudentFee.find({ student_id: { $in: studentIds } })
            .populate('student_id', 'student_name roll_no');

        const payments = await FeePayment.find({ student_id: { $in: studentIds } })
            .sort({ payment_date: -1 });

        const totalFees = feeAssignments.reduce((acc, f) => acc + (f.total_amount || 0), 0);
        const paidAmount = feeAssignments.reduce((acc, f) => acc + (f.total_paid || 0), 0);
        const pendingAmount = Math.max(0, totalFees - paidAmount);

        res.json({
            totalFees,
            paidAmount,
            pendingAmount,
            feeAssignments,
            paymentHistory: payments
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

// ==========================================
// 10. Announcement APIs
// ==========================================
const getAnnouncements = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const notices = await Notice.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notice.countDocuments({});

        const formatted = notices.map(n => ({
            id: n._id,
            title: n.title,
            description: n.content || n.description || '',
            createdDate: n.createdAt,
            attachment: n.attachment || ''
        }));

        res.json({
            total,
            page,
            pages: Math.ceil(total / limit),
            announcements: formatted
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
    }
};

const getAnnouncementById = async (req, res) => {
    try {
        const notice = await Notice.findById(req.params.id);
        if (!notice) return res.status(404).json({ message: 'Announcement not found' });

        res.json({
            id: notice._id,
            title: notice.title,
            description: notice.content || notice.description || '',
            createdDate: notice.createdAt,
            attachment: notice.attachment || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch announcement details', error: error.message });
    }
};

// ==========================================
// 11. Teacher Communication APIs
// ==========================================
const getConversations = async (req, res) => {
    try {
        const conversations = await ParentConversation.find({ parent_id: req.user._id })
            .populate('recipient_id', 'email phone role')
            .populate('student_id', 'student_name roll_no')
            .sort({ last_message_at: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch conversations', error: error.message });
    }
};

const getConversationById = async (req, res) => {
    try {
        const conversation = await ParentConversation.findOne({
            _id: req.params.conversationId,
            parent_id: req.user._id
        }).populate('recipient_id', 'email phone role')
          .populate('student_id', 'student_name roll_no');

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or access forbidden' });
        }

        res.json(conversation);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch message thread', error: error.message });
    }
};

const startConversation = async (req, res) => {
    try {
        const { recipient_id, recipient_role, student_id, subject, message } = req.body;

        if (!recipient_id || !recipient_role || !student_id || !subject || !message) {
            return res.status(400).json({ message: 'Recipient ID, role, student ID, subject, and message are required' });
        }

        // Security check: verify student belongs to parent
        const student = await verifyParentStudentOwnership(req.user._id, student_id);

        // Security rule: Validate recipient is Class Teacher, Subject Teacher, or School Admin of this student's class
        let isValidRecipient = false;

        if (recipient_role === 'SchoolAdmin') {
            const adminUser = await User.findOne({ _id: recipient_id, role: 'SchoolAdmin' });
            if (adminUser) isValidRecipient = true;
        } else {
            // Check if recipient is class incharge
            const cls = await Class.findById(student.class_id);
            if (cls && cls.class_incharge_id) {
                const inchargeTeacher = await Teacher.findById(cls.class_incharge_id);
                if (inchargeTeacher && inchargeTeacher.user_id.toString() === recipient_id.toString()) {
                    isValidRecipient = true;
                }
            }

            // Check if recipient is subject teacher for this student's class
            if (!isValidRecipient) {
                const subjectAssignments = await TeacherAssignment.find({ class_id: student.class_id });
                for (const sa of subjectAssignments) {
                    const t = await Teacher.findById(sa.teacher_id);
                    if (t && t.user_id.toString() === recipient_id.toString()) {
                        isValidRecipient = true;
                        break;
                    }
                }
            }
        }

        if (!isValidRecipient) {
            return res.status(403).json({
                message: 'Forbidden: Parents can only initiate messages with their child\'s Class Teacher, Subject Teacher, or School Admin.'
            });
        }

        const newConv = await ParentConversation.create({
            parent_id: req.user._id,
            recipient_id,
            recipient_role,
            student_id,
            school_id: student.school_id,
            subject,
            last_message: message,
            last_message_at: new Date(),
            messages: [{
                sender_id: req.user._id,
                sender_role: 'Parent',
                message
            }]
        });

        res.status(201).json(newConv);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

const replyConversation = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { message, attachment } = req.body;

        if (!message) return res.status(400).json({ message: 'Message text is required' });

        const conversation = await ParentConversation.findOne({
            _id: conversationId,
            parent_id: req.user._id
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found or access forbidden' });
        }

        conversation.messages.push({
            sender_id: req.user._id,
            sender_role: 'Parent',
            message,
            attachment: attachment || ''
        });

        conversation.last_message = message;
        conversation.last_message_at = new Date();
        await conversation.save();

        res.json({ message: 'Reply sent successfully', conversation });
    } catch (error) {
        res.status(500).json({ message: 'Failed to send reply', error: error.message });
    }
};

// ==========================================
// 12. Leave Request APIs
// ==========================================
const submitLeaveRequest = async (req, res) => {
    try {
        const { student_id, leave_type, from_date, to_date, reason, attachment } = req.body;

        if (!student_id || !leave_type || !from_date || !to_date || !reason) {
            return res.status(400).json({ message: 'Student ID, leave type, dates, and reason are required' });
        }

        const student = await verifyParentStudentOwnership(req.user._id, student_id);

        const leave = await StudentLeave.create({
            student_id: student._id,
            parent_user_id: req.user._id,
            school_id: student.school_id,
            class_id: student.class_id,
            leave_type,
            from_date: new Date(from_date),
            to_date: new Date(to_date),
            reason,
            attachment: attachment || '',
            status: 'Pending'
        });

        res.status(201).json({
            message: 'Leave request submitted successfully',
            leave
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

const getLeaveRequests = async (req, res) => {
    try {
        const { studentId } = req.query;
        let studentIds = [];

        if (studentId) {
            const s = await verifyParentStudentOwnership(req.user._id, studentId);
            studentIds = [s._id];
        } else {
            const students = await Student.find({ parent_user_id: req.user._id });
            studentIds = students.map(s => s._id);
        }

        const leaves = await StudentLeave.find({
            parent_user_id: req.user._id,
            student_id: { $in: studentIds }
        }).populate('student_id', 'student_name roll_no')
          .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        res.status(error.statusCode || 500).json({ message: error.message });
    }
};

const getLeaveRequestById = async (req, res) => {
    try {
        const leave = await StudentLeave.findOne({
            _id: req.params.id,
            parent_user_id: req.user._id
        }).populate('student_id', 'student_name roll_no');

        if (!leave) return res.status(404).json({ message: 'Leave request not found or access forbidden' });

        res.json(leave);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch leave request', error: error.message });
    }
};

// ==========================================
// 13. Bus Tracking APIs
// ==========================================
const getTransportDetails = async (req, res) => {
    try {
        const students = await Student.find({ parent_user_id: req.user._id });
        const studentIds = students.map(s => s._id);

        const transports = await StudentTransport.find({ student_id: { $in: studentIds } })
            .populate('bus_id')
            .populate('route_id')
            .populate('stop_id')
            .populate('student_id', 'student_name roll_no');

        res.json(transports);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch transport details', error: error.message });
    }
};

const getBusLiveLocation = async (req, res) => {
    try {
        const students = await Student.find({ parent_user_id: req.user._id });
        const studentIds = students.map(s => s._id);

        const transport = await StudentTransport.findOne({ student_id: { $in: studentIds } })
            .populate('bus_id')
            .populate('route_id')
            .populate('stop_id');

        if (!transport || !transport.bus_id) {
            return res.status(404).json({ message: 'No active bus transport allocation found for your children' });
        }

        const activeTrip = await TripHistory.findOne({
            bus_id: transport.bus_id._id,
            status: 'IN_PROGRESS'
        }).sort({ createdAt: -1 });

        const driver = await Driver.findOne({ assigned_bus_id: transport.bus_id._id });

        res.json({
            busNumber: transport.bus_id.bus_number,
            registrationNumber: transport.bus_id.registration_number || '',
            routeName: transport.route_id ? transport.route_id.name : '',
            driverName: driver ? driver.name : 'Assigned Driver',
            driverMobile: driver ? driver.phone : '',
            currentLatitude: activeTrip ? activeTrip.current_latitude : 12.9716,
            currentLongitude: activeTrip ? activeTrip.current_longitude : 77.5946,
            currentStop: activeTrip ? (activeTrip.current_stop || 'En Route') : 'School Depot',
            nextStop: transport.stop_id ? transport.stop_id.name : 'Next Scheduled Stop',
            estimatedArrivalTime: activeTrip ? (activeTrip.eta || '15 mins') : 'On Schedule'
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch bus live location', error: error.message });
    }
};

// ==========================================
// 14. Notification APIs
// ==========================================
const getNotifications = async (req, res) => {
    try {
        const { type } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const query = { recipient_id: req.user._id };
        if (type) query.type = type;

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({ recipient_id: req.user._id, is_read: false });

        res.json({
            total,
            unreadCount,
            page,
            pages: Math.ceil(total / limit),
            notifications
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};

const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient_id: req.user._id },
            { is_read: true, read_at: new Date() },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update notification', error: error.message });
    }
};

module.exports = {
    getParentProfile,
    getParentDashboard,
    getLinkedStudents,
    getStudentDetails,
    getAttendance,
    getHomework,
    getTimetable,
    getExams,
    getResults,
    getReportCard,
    getFees,
    getAnnouncements,
    getAnnouncementById,
    getConversations,
    getConversationById,
    startConversation,
    replyConversation,
    submitLeaveRequest,
    getLeaveRequests,
    getLeaveRequestById,
    getTransportDetails,
    getBusLiveLocation,
    getNotifications,
    markNotificationRead
};
