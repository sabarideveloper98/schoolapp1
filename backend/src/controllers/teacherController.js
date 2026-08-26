const Student = require('../models/Student');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Class = require('../models/Class');
const ClassSubject = require('../models/ClassSubject');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');

// Helper to get teacher profile
const getTeacherProfile = async (userId) => {
    const teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher) throw new Error('Teacher not found');
    return teacher;
};

// @desc    Get all students assigned to the teacher
// @route   GET /api/teacher/students
// @access  Private (Teacher only)
const getStudents = async (req, res) => {
    try {
        const teacher = await getTeacherProfile(req.user._id);
        
        // Find classes where this teacher is incharge
        const inchargeClasses = await Class.find({ class_incharge_id: teacher._id });
        const inchargeClassIds = inchargeClasses.map(c => c._id.toString());

        // Find classes where this teacher is assigned as a subject teacher
        const subjectAssignments = await ClassSubject.find({ teacher_id: teacher._id });
        const subjectClassIds = subjectAssignments.map(a => a.class_id.toString());

        // Merge and deduplicate class IDs
        const allClassIds = [...new Set([...inchargeClassIds, ...subjectClassIds])];

        const students = await Student.find({ class_id: { $in: allClassIds } });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a student (and parent account)
// @route   POST /api/teacher/students
// @access  Private (Teacher only)
const createStudent = async (req, res) => {
    try {
        const teacher = await getTeacherProfile(req.user._id);
        const { 
            student_name, age, address, dob, blood_group, photo,
            parent_name, parent_phone, parent_email, class_id 
        } = req.body;

        // Check if teacher is authorized to add to this class (must be incharge)
        const targetClass = await Class.findOne({ _id: class_id, class_incharge_id: teacher._id });
        if (!targetClass) {
            return res.status(403).json({ message: 'Not authorized to add student to this class' });
        }

        // Check if parent user already exists by phone
        let parentUser = await User.findOne({ phone: parent_phone });
        let parentPassword = null;

        if (!parentUser) {
            // Generate parent password (e.g., ParentName@123)
            parentPassword = `${parent_name.replace(/\s+/g, '')}@123`;
            parentUser = await User.create({
                phone: parent_phone,
                email: parent_email,
                password: parentPassword,
                role: 'Parent'
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
            parentPassword, // For demo purposes, returning the password
            message: 'Student and Parent account created'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all classes assigned to the teacher (either incharge or teaching a subject)
// @route   GET /api/teacher/classes
// @access  Private (Teacher only)
const getClasses = async (req, res) => {
    try {
        const teacher = await getTeacherProfile(req.user._id);

        // Find classes where teacher is incharge
        const inchargeClasses = await Class.find({ class_incharge_id: teacher._id }).lean();

        // Find subject assignments for this teacher
        const subjectAssignments = await ClassSubject.find({ teacher_id: teacher._id }).populate('subject_id').populate('class_id').lean();

        // Combine and map data
        const classMap = {};

        inchargeClasses.forEach(c => {
            classMap[c._id] = {
                _id: c._id,
                class: c.class,
                section: c.section,
                no_student: c.no_student,
                isIncharge: true,
                subjects: []
            };
        });

        subjectAssignments.forEach(assignment => {
            if (assignment.class_id) {
                const classId = assignment.class_id._id;
                if (!classMap[classId]) {
                    classMap[classId] = {
                        _id: classId,
                        class: assignment.class_id.class,
                        section: assignment.class_id.section,
                        no_student: assignment.class_id.no_student,
                        isIncharge: false,
                        subjects: []
                    };
                }
                if (assignment.subject_id) {
                    classMap[classId].subjects.push({
                        _id: assignment.subject_id._id,
                        name: assignment.subject_id.name,
                        code: assignment.subject_id.code
                    });
                }
            }
        });

        res.json(Object.values(classMap));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Send a message (single or group)
// @route   POST /api/teacher/messages
// @access  Private (Teacher only)
const sendMessage = async (req, res) => {
    try {
        const teacher = await getTeacherProfile(req.user._id);
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
            
        // We could populate receiver details, but for now we'll just return the raw messages
        // since the frontend will have the class/student list to cross-reference if needed.
        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getStudents,
    createStudent,
    getClasses,
    sendMessage,
    getSentMessages
};
