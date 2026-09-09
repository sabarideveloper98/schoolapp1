const Homework = require('../models/Homework');
const HomeworkAssignment = require('../models/HomeworkAssignment');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const HomeworkReview = require('../models/HomeworkReview');
const HomeworkNotification = require('../models/HomeworkNotification');
const School = require('../models/School');
const Student = require('../models/Student');
const Class = require('../models/Class');
const User = require('../models/User');

// Helper to resolve School ID
const getSchoolId = async (user) => {
    if (user.school_id) return user.school_id;
    let school = await School.findOne({ admin_id: user._id });
    if (!school) {
        school = await School.findOne({});
    }
    return school ? school._id : user._id;
};

// ----------------------------------------------------
// 1. Homework Creation & CRUD (Admin & Teacher)
// ----------------------------------------------------
const createHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const {
            title,
            subject_id,
            subject_name,
            description,
            instructions,
            category,
            assignment_type, // 'Student', 'Class', 'Section', 'MultipleClasses'
            assigned_classes,
            assigned_section,
            assigned_students,
            due_date,
            attachment_url,
            video_link,
            max_marks
        } = req.body;

        if (!title || !subject_name || !description || !assignment_type || !due_date) {
            return res.status(400).json({ message: 'Title, subject name, description, assignment type and due date are required' });
        }

        const creator_name = req.user.name || req.user.email || 'Teacher/Admin';

        // 1. Create main Homework document
        const newHomework = await Homework.create({
            school_id,
            created_by: req.user._id,
            creator_name,
            title,
            subject_id: subject_id || null,
            subject_name,
            description,
            instructions: instructions || '',
            category: category || 'Homework',
            assignment_type,
            assigned_classes: assigned_classes || [],
            assigned_section: assigned_section || '',
            assigned_students: assigned_students || [],
            assigned_date: new Date(),
            due_date: new Date(due_date),
            attachment_url: attachment_url || '',
            video_link: video_link || '',
            max_marks: max_marks ? Number(max_marks) : 100,
            status: 'Active'
        });

        // 2. Identify target students based on assignment_type
        let targetStudents = [];

        if (assignment_type === 'Student' && assigned_students && assigned_students.length > 0) {
            targetStudents = await Student.find({ _id: { $in: assigned_students } });
        } else if (assignment_type === 'Class' && assigned_classes && assigned_classes.length > 0) {
            targetStudents = await Student.find({ class_id: assigned_classes[0] });
        } else if (assignment_type === 'Section' && assigned_classes && assigned_classes.length > 0) {
            // Find students in class and section
            const classObj = await Class.findById(assigned_classes[0]);
            targetStudents = await Student.find({
                class_id: assigned_classes[0],
                ...(assigned_section ? { section: assigned_section } : {})
            });
        } else if (assignment_type === 'MultipleClasses' && assigned_classes && assigned_classes.length > 0) {
            targetStudents = await Student.find({ class_id: { $in: assigned_classes } });
        } else {
            // Fallback: search all students in school
            targetStudents = await Student.find({ school_id });
        }

        // 3. Create HomeworkAssignment records for each targeted student
        if (targetStudents.length > 0) {
            const assignmentsToCreate = targetStudents.map(student => ({
                homework_id: newHomework._id,
                school_id,
                student_id: student._id,
                class_id: student.class_id || null,
                status: 'Pending'
            }));
            await HomeworkAssignment.insertMany(assignmentsToCreate);

            // 4. Create Notifications for targeted students
            const notificationsToCreate = targetStudents.map(student => ({
                school_id,
                student_id: student._id,
                homework_id: newHomework._id,
                title: `New Homework: ${title}`,
                message: `New ${category} for ${subject_name} assigned by ${creator_name}. Due on ${new Date(due_date).toLocaleDateString()}.`,
                type: 'Assigned'
            }));
            await HomeworkNotification.insertMany(notificationsToCreate);
        }

        res.status(201).json({
            message: 'Homework created and assigned successfully',
            homework: newHomework,
            assignedCount: targetStudents.length
        });
    } catch (error) {
        console.error('Error creating homework:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getHomeworkList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { class_id, subject_name, category } = req.query;

        const query = { school_id };
        if (class_id) query.assigned_classes = class_id;
        if (subject_name) query.subject_name = new RegExp(subject_name, 'i');
        if (category) query.category = category;

        const homeworks = await Homework.find(query)
            .populate('assigned_classes', 'class class_name section')
            .sort({ createdAt: -1 });

        // Enrich with submission counts
        const enrichedHomeworks = await Promise.all(homeworks.map(async (hw) => {
            const totalAssigned = await HomeworkAssignment.countDocuments({ homework_id: hw._id });
            const totalSubmitted = await HomeworkSubmission.countDocuments({ homework_id: hw._id });
            const totalReviewed = await HomeworkReview.countDocuments({ homework_id: hw._id });
            const totalLate = await HomeworkSubmission.countDocuments({ homework_id: hw._id, is_late: true });

            return {
                ...hw.toObject(),
                stats: {
                    totalAssigned,
                    totalSubmitted,
                    totalReviewed,
                    totalLate,
                    pendingSubmissions: Math.max(0, totalAssigned - totalSubmitted)
                }
            };
        }));

        res.json(enrichedHomeworks);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getHomeworkById = async (req, res) => {
    try {
        const homework = await Homework.findById(req.params.id)
            .populate('assigned_classes', 'class class_name section')
            .populate('assigned_students', 'student_name roll_no admission_number');

        if (!homework) return res.status(404).json({ message: 'Homework not found' });

        const assignments = await HomeworkAssignment.find({ homework_id: homework._id })
            .populate('student_id', 'student_name roll_no admission_number parent_name parent_phone')
            .populate('class_id', 'class class_name section');

        const submissions = await HomeworkSubmission.find({ homework_id: homework._id })
            .populate('student_id', 'student_name roll_no admission_number');

        const reviews = await HomeworkReview.find({ homework_id: homework._id })
            .populate('student_id', 'student_name')
            .populate('evaluated_by', 'name email');

        res.json({
            homework,
            assignments,
            submissions,
            reviews
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateHomework = async (req, res) => {
    try {
        const homework = await Homework.findById(req.params.id);
        if (!homework) return res.status(404).json({ message: 'Homework not found' });

        Object.assign(homework, req.body);
        if (req.body.due_date) homework.due_date = new Date(req.body.due_date);
        await homework.save();

        res.json({ message: 'Homework updated successfully', homework });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteHomework = async (req, res) => {
    try {
        const homework = await Homework.findById(req.params.id);
        if (!homework) return res.status(404).json({ message: 'Homework not found' });

        await HomeworkAssignment.deleteMany({ homework_id: homework._id });
        await HomeworkSubmission.deleteMany({ homework_id: homework._id });
        await HomeworkReview.deleteMany({ homework_id: homework._id });
        await HomeworkNotification.deleteMany({ homework_id: homework._id });
        await Homework.findByIdAndDelete(homework._id);

        res.json({ message: 'Homework and associated records deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 2. Student Homework & Submission Portal
// ----------------------------------------------------
const getStudentHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        let studentId = req.query.student_id;

        if (!studentId && req.user.role === 'Student') {
            const studentDoc = await Student.findOne({ user_id: req.user._id });
            if (studentDoc) studentId = studentDoc._id;
        }

        if (!studentId) {
            // Find student by email or user
            const studentDoc = await Student.findOne({ school_id });
            if (studentDoc) studentId = studentDoc._id;
        }

        const assignments = await HomeworkAssignment.find({ student_id: studentId })
            .populate({
                path: 'homework_id',
                populate: { path: 'assigned_classes', select: 'class class_name section' }
            })
            .sort({ createdAt: -1 });

        const studentHomeworkFeed = await Promise.all(assignments.map(async (assign) => {
            if (!assign.homework_id) return null;

            const submission = await HomeworkSubmission.findOne({
                homework_id: assign.homework_id._id,
                student_id: studentId
            });

            const review = await HomeworkReview.findOne({
                homework_id: assign.homework_id._id,
                student_id: studentId
            });

            const now = new Date();
            const dueDate = new Date(assign.homework_id.due_date);
            const isDueApproaching = !submission && (dueDate - now <= 48 * 60 * 60 * 1000) && (dueDate > now);

            return {
                assignment_id: assign._id,
                homework: assign.homework_id,
                status: assign.status,
                submission,
                review,
                is_due_approaching: isDueApproaching,
                is_overdue: !submission && (now > dueDate)
            };
        }));

        res.json(studentHomeworkFeed.filter(Boolean));
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const submitHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { homework_id, student_id, submission_notes, attachment_url } = req.body;

        if (!homework_id) return res.status(400).json({ message: 'Homework ID is required' });

        let targetStudentId = student_id;
        if (!targetStudentId && req.user.role === 'Student') {
            const studentDoc = await Student.findOne({ user_id: req.user._id });
            if (studentDoc) targetStudentId = studentDoc._id;
        }

        if (!targetStudentId) return res.status(400).json({ message: 'Student identification failed' });

        const homework = await Homework.findById(homework_id);
        if (!homework) return res.status(404).json({ message: 'Homework not found' });

        const now = new Date();
        const is_late = now > new Date(homework.due_date);

        // Upsert submission
        let submission = await HomeworkSubmission.findOne({ homework_id, student_id: targetStudentId });
        if (submission) {
            submission.submission_notes = submission_notes || submission.submission_notes;
            submission.attachment_url = attachment_url || submission.attachment_url;
            submission.submitted_at = now;
            submission.is_late = is_late;
            await submission.save();
        } else {
            submission = await HomeworkSubmission.create({
                homework_id,
                student_id: targetStudentId,
                school_id,
                submission_notes: submission_notes || '',
                attachment_url: attachment_url || '',
                submitted_at: now,
                is_late
            });
        }

        // Update HomeworkAssignment status
        await HomeworkAssignment.findOneAndUpdate(
            { homework_id, student_id: targetStudentId },
            { status: is_late ? 'Late' : 'Submitted' }
        );

        res.status(201).json({
            message: 'Homework submitted successfully',
            submission
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 3. Teacher Evaluation & Review
// ----------------------------------------------------
const evaluateSubmission = async (req, res) => {
    try {
        const { submission_id, marks_obtained, remarks, status } = req.body;

        if (!submission_id) return res.status(400).json({ message: 'Submission ID is required' });

        const submission = await HomeworkSubmission.findById(submission_id).populate('homework_id');
        if (!submission) return res.status(404).json({ message: 'Homework submission not found' });

        let review = await HomeworkReview.findOne({ submission_id });
        if (review) {
            review.marks_obtained = marks_obtained !== undefined ? Number(marks_obtained) : review.marks_obtained;
            review.remarks = remarks || review.remarks;
            review.status = status || review.status;
            review.evaluated_by = req.user._id;
            review.evaluated_at = new Date();
            await review.save();
        } else {
            review = await HomeworkReview.create({
                submission_id,
                homework_id: submission.homework_id._id,
                student_id: submission.student_id,
                evaluated_by: req.user._id,
                marks_obtained: marks_obtained ? Number(marks_obtained) : 0,
                remarks: remarks || '',
                status: status || 'Approved',
                evaluated_at: new Date()
            });
        }

        // Update Assignment status to Reviewed
        await HomeworkAssignment.findOneAndUpdate(
            { homework_id: submission.homework_id._id, student_id: submission.student_id },
            { status: 'Reviewed' }
        );

        // Notify student & parent
        await HomeworkNotification.create({
            school_id: submission.school_id,
            student_id: submission.student_id,
            homework_id: submission.homework_id._id,
            title: `Homework Evaluated: ${submission.homework_id.title}`,
            message: `Your submission for ${submission.homework_id.subject_name} has been evaluated. Score: ${marks_obtained}/${submission.homework_id.max_marks}. Status: ${status || 'Approved'}.`,
            type: 'Reviewed'
        });

        res.json({ message: 'Homework evaluated successfully', review });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 4. Reports & Dashboards
// ----------------------------------------------------
const getHomeworkStats = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);

        const totalHomework = await Homework.countDocuments({ school_id });
        const totalAssignments = await HomeworkAssignment.countDocuments({ school_id });
        const totalSubmissions = await HomeworkSubmission.countDocuments({ school_id });
        const totalReviewed = await HomeworkReview.countDocuments({ school_id });
        const totalLate = await HomeworkSubmission.countDocuments({ school_id, is_late: true });
        const pendingSubmissions = Math.max(0, totalAssignments - totalSubmissions);

        res.json({
            totalHomework,
            totalAssignments,
            totalSubmissions,
            totalReviewed,
            totalLate,
            pendingSubmissions
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getHomeworkNotifications = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const notifications = await HomeworkNotification.find({ school_id })
            .sort({ createdAt: -1 })
            .limit(30);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createHomework,
    getHomeworkList,
    getHomeworkById,
    updateHomework,
    deleteHomework,
    getStudentHomework,
    submitHomework,
    evaluateSubmission,
    getHomeworkStats,
    getHomeworkNotifications
};
