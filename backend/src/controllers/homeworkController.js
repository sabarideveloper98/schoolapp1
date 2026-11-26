const mongoose = require('mongoose');
const Homework = require('../models/Homework');
const HomeworkAssignment = require('../models/HomeworkAssignment');
const HomeworkSubmission = require('../models/HomeworkSubmission');
const HomeworkReview = require('../models/HomeworkReview');
const HomeworkNotification = require('../models/HomeworkNotification');
const School = require('../models/School');
const Student = require('../models/Student');
const Class = require('../models/Class');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const ClassSubject = require('../models/ClassSubject');
const TeacherAssignment = require('../models/TeacherAssignment');

// Helper to resolve School ID
const getSchoolId = async (user) => {
    if (!user) return null;
    if (user.school_id) return user.school_id;
    let school = await School.findOne({ admin_id: user._id });
    if (school) return school._id;
    if (user.reference_id) {
        const teacher = await Teacher.findById(user.reference_id);
        if (teacher && teacher.school_id) return teacher.school_id;
    }
    const teacherByUser = await Teacher.findOne({ user_id: user._id });
    if (teacherByUser && teacherByUser.school_id) return teacherByUser.school_id;
    school = await School.findOne({});
    return school ? school._id : user._id;
};

// Teacher Authorization Helpers
const getTeacherProfileHelper = async (userId) => {
    if (!userId) return null;
    let teacher = await Teacher.findOne({ user_id: userId });
    if (!teacher) {
        teacher = await Teacher.findById(userId);
    }
    return teacher;
};

const getTeacherClassIdsHelper = async (teacherId, schoolId) => {
    if (!teacherId) return [];
    const classQuery = { class_incharge_id: teacherId };
    if (schoolId) classQuery.school_id = schoolId;
    const inchargeClasses = await Class.find(classQuery);
    const inchargeIds = inchargeClasses.map(c => c._id.toString());

    const taQuery = { teacher_id: teacherId };
    if (schoolId) taQuery.school_id = schoolId;
    const assignments = await TeacherAssignment.find(taQuery);
    const assignmentIds = assignments.map(a => a.class_id ? a.class_id.toString() : null).filter(Boolean);

    const csQuery = { teacher_id: teacherId };
    if (schoolId) csQuery.school_id = schoolId;
    const classSubjects = await ClassSubject.find(csQuery);
    const csIds = classSubjects.map(cs => cs.class_id ? cs.class_id.toString() : null).filter(Boolean);

    return [...new Set([...inchargeIds, ...assignmentIds, ...csIds])];
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
            return res.status(400).json({ success: false, message: 'Title, subject name, description, assignment type and due date are required' });
        }

        const isAssignmentRoute = req.baseUrl.includes('assignment');
        const resolvedCategory = category || (isAssignmentRoute ? 'Assignment' : 'Homework');

        let teacherId = null;
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            teacherId = teacher?._id || req.user._id;

            // Authorization: verify teacher is authorized for the target classes
            const authorizedClassIds = await getTeacherClassIdsHelper(teacherId, school_id);
            if (assigned_classes && assigned_classes.length > 0 && authorizedClassIds.length > 0) {
                const unauthorized = assigned_classes.some(cId => !authorizedClassIds.includes(cId.toString()));
                if (unauthorized) {
                    return res.status(403).json({
                        success: false,
                        message: 'Forbidden: You are not authorized to assign homework/assignments to classes you do not teach'
                    });
                }
            }
        }

        const creator_name = req.user.name || req.user.email || 'Teacher/Admin';

        // 1. Create main Homework document
        const newHomework = await Homework.create({
            school_id,
            created_by: req.user._id,
            creator_name,
            teacher_id: teacherId,
            title,
            subject_id: subject_id || null,
            subject_name,
            description,
            instructions: instructions || '',
            category: resolvedCategory,
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
                title: `New ${resolvedCategory}: ${title}`,
                message: `New ${resolvedCategory} for ${subject_name} assigned by ${creator_name}. Due on ${new Date(due_date).toLocaleDateString()}.`,
                type: 'Assigned'
            }));
            await HomeworkNotification.insertMany(notificationsToCreate);
        }

        res.status(201).json({
            success: true,
            message: `${resolvedCategory} created and assigned successfully`,
            homework: newHomework,
            data: {
                homework: newHomework,
                assignedCount: targetStudents.length
            },
            assignedCount: targetStudents.length
        });
    } catch (error) {
        console.error('Error creating homework:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getHomeworkList = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { class_id, section, subject_id, subject_name, category, status, page, limit } = req.query;

        const query = { school_id };
        if (class_id) query.assigned_classes = class_id;
        if (section) query.assigned_section = section;
        if (subject_id) {
            if (mongoose.Types.ObjectId.isValid(subject_id)) {
                query.subject_id = subject_id;
            } else {
                query.subject_name = new RegExp(subject_id, 'i');
            }
        }
        if (subject_name) query.subject_name = new RegExp(subject_name, 'i');

        // Route-aware category defaulting
        const isAssignmentRoute = req.baseUrl.includes('assignment');
        if (category) {
            query.category = category;
        } else if (isAssignmentRoute) {
            query.category = 'Assignment';
        } else if (req.baseUrl.includes('teacher/homework')) {
            query.category = 'Homework';
        }

        if (status) query.status = status;

        // Teacher role authorization filtering: access own created homework or assigned classes
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id, teacher?._id, teacher?.user_id].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, school_id);

            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { created_by: { $in: teacherIds } },
                    { teacher_id: { $in: teacherIds } },
                    { assigned_classes: { $in: authorizedClassIds } }
                ]
            });
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const totalRecords = await Homework.countDocuments(query);

        let hwQuery = Homework.find(query)
            .populate('assigned_classes', 'class class_name section')
            .populate({
                path: 'assigned_students',
                select: 'student_name roll_no admission_number class section class_id',
                populate: { path: 'class_id', select: 'class section class_name' }
            })
            .populate('created_by', 'name email role')
            .sort({ createdAt: -1 });

        if (page && limit) {
            hwQuery = hwQuery.skip(skip).limit(limitNum);
        }

        const homeworks = await hwQuery;

        // Enrich with submission counts and standard response fields
        const enrichedHomeworks = await Promise.all(homeworks.map(async (hw) => {
            const totalAssigned = await HomeworkAssignment.countDocuments({ homework_id: hw._id });
            const totalSubmitted = await HomeworkSubmission.countDocuments({ homework_id: hw._id });
            const totalReviewed = await HomeworkReview.countDocuments({ homework_id: hw._id });
            const totalLate = await HomeworkSubmission.countDocuments({ homework_id: hw._id, is_late: true });
            const firstClass = hw.assigned_classes && hw.assigned_classes.length > 0 ? hw.assigned_classes[0] : null;

            return {
                ...hw.toObject(),
                homeworkId: hw._id,
                title: hw.title,
                description: hw.description,
                academicYear: '2026-2027',
                classId: firstClass?._id || null,
                className: firstClass?.class || firstClass?.class_name || 'N/A',
                sectionId: hw.assigned_section || firstClass?.section || null,
                sectionName: hw.assigned_section || firstClass?.section || 'All',
                subjectId: hw.subject_id || null,
                subjectName: hw.subject_name,
                teacherId: hw.teacher_id || hw.created_by?._id || hw.created_by || null,
                teacherName: hw.created_by?.name || hw.creator_name || 'Teacher/Admin',
                assignedDate: hw.assigned_date,
                submissionDate: hw.due_date,
                dueDate: hw.due_date,
                attachment: hw.attachment_url || '',
                document: hw.attachment_url || '',
                category: hw.category || 'Homework',
                status: hw.status,
                createdDate: hw.createdAt,
                updatedDate: hw.updatedAt,
                stats: {
                    totalAssigned,
                    totalSubmitted,
                    totalReviewed,
                    totalLate,
                    pendingSubmissions: Math.max(0, totalAssigned - totalSubmitted)
                }
            };
        }));

        if (req.baseUrl.includes('school-admin') || req.baseUrl.includes('schooladmin') || req.baseUrl.includes('teacher') || req.query.envelope === 'true' || req.query.page) {
            return res.json({
                success: true,
                message: `${query.category || 'Homework / Assignments'} retrieved successfully`,
                data: {
                    homework: enrichedHomeworks,
                    totalRecords,
                    pagination: {
                        currentPage: pageNum,
                        totalPages: Math.ceil(totalRecords / limitNum),
                        limit: limitNum
                    }
                }
            });
        }

        res.json(enrichedHomeworks);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getHomeworkById = async (req, res) => {
    try {
        const homework = await Homework.findById(req.params.id)
            .populate('assigned_classes', 'class class_name section')
            .populate('assigned_students', 'student_name roll_no admission_number')
            .populate('created_by', 'name email role');

        if (!homework) return res.status(404).json({ success: false, message: 'Homework / Assignment not found' });

        // Teacher role authorization check
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id?.toString(), teacher?._id?.toString(), teacher?.user_id?.toString()].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, homework.school_id);
            const isCreator = teacherIds.includes(homework.created_by?._id?.toString()) ||
                              teacherIds.includes(homework.created_by?.toString()) ||
                              teacherIds.includes(homework.teacher_id?.toString());
            const hasClass = homework.assigned_classes?.some(c => authorizedClassIds.includes(c._id ? c._id.toString() : c.toString()));

            if (!isCreator && !hasClass && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You do not have permission to access this homework/assignment'
                });
            }
        }

        const assignments = await HomeworkAssignment.find({ homework_id: homework._id })
            .populate('student_id', 'student_name roll_no admission_number parent_name parent_phone')
            .populate('class_id', 'class class_name section');

        const submissions = await HomeworkSubmission.find({ homework_id: homework._id })
            .populate('student_id', 'student_name roll_no admission_number');

        const reviews = await HomeworkReview.find({ homework_id: homework._id })
            .populate('student_id', 'student_name')
            .populate('evaluated_by', 'name email');

        const firstClass = homework.assigned_classes && homework.assigned_classes.length > 0 ? homework.assigned_classes[0] : null;

        const formattedHomework = {
            ...homework.toObject(),
            homeworkId: homework._id,
            title: homework.title,
            description: homework.description,
            academicYear: '2026-2027',
            classId: firstClass?._id || null,
            className: firstClass?.class || firstClass?.class_name || 'N/A',
            sectionId: homework.assigned_section || firstClass?.section || null,
            sectionName: homework.assigned_section || firstClass?.section || 'All',
            subjectId: homework.subject_id || null,
            subjectName: homework.subject_name,
            teacherId: homework.teacher_id || homework.created_by?._id || homework.created_by || null,
            teacherName: homework.created_by?.name || homework.creator_name || 'Teacher/Admin',
            assignedDate: homework.assigned_date,
            submissionDate: homework.due_date,
            dueDate: homework.due_date,
            attachment: homework.attachment_url || '',
            document: homework.attachment_url || '',
            category: homework.category || 'Homework',
            status: homework.status,
            createdDate: homework.createdAt,
            updatedDate: homework.updatedAt,
            stats: {
                totalAssigned: assignments.length,
                totalSubmitted: submissions.length,
                totalReviewed: reviews.length,
                pendingSubmissions: Math.max(0, assignments.length - submissions.length)
            }
        };

        res.json({
            success: true,
            message: `${formattedHomework.category || 'Homework'} details retrieved successfully`,
            data: {
                homework: formattedHomework,
                assignments,
                submissions,
                reviews
            },
            homework: formattedHomework,
            assignments,
            submissions,
            reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const updateHomework = async (req, res) => {
    try {
        const homework = await Homework.findById(req.params.id);
        if (!homework) return res.status(404).json({ success: false, message: 'Homework / Assignment not found' });

        // Teacher role authorization check
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id?.toString(), teacher?._id?.toString(), teacher?.user_id?.toString()].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, homework.school_id);
            const isCreator = teacherIds.includes(homework.created_by?.toString()) ||
                              teacherIds.includes(homework.teacher_id?.toString());
            const hasClass = homework.assigned_classes?.some(c => authorizedClassIds.includes(c.toString()));

            if (!isCreator && !hasClass && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You do not have permission to update this homework/assignment'
                });
            }
        }

        Object.assign(homework, req.body);
        if (req.body.due_date) homework.due_date = new Date(req.body.due_date);
        await homework.save();

        res.json({
            success: true,
            message: `${homework.category || 'Homework'} updated successfully`,
            homework,
            data: { homework }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const deleteHomework = async (req, res) => {
    try {
        const homework = await Homework.findById(req.params.id);
        if (!homework) return res.status(404).json({ success: false, message: 'Homework / Assignment not found' });

        // Teacher role authorization check
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id?.toString(), teacher?._id?.toString(), teacher?.user_id?.toString()].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, homework.school_id);
            const isCreator = teacherIds.includes(homework.created_by?.toString()) ||
                              teacherIds.includes(homework.teacher_id?.toString());
            const hasClass = homework.assigned_classes?.some(c => authorizedClassIds.includes(c.toString()));

            if (!isCreator && !hasClass && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You do not have permission to delete this homework/assignment'
                });
            }
        }

        await HomeworkAssignment.deleteMany({ homework_id: homework._id });
        await HomeworkSubmission.deleteMany({ homework_id: homework._id });
        await HomeworkReview.deleteMany({ homework_id: homework._id });
        await HomeworkNotification.deleteMany({ homework_id: homework._id });
        await Homework.findByIdAndDelete(homework._id);

        res.json({
            success: true,
            message: `${homework.category || 'Homework'} and associated records deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 2. Student Homework & Submission Portal
// ----------------------------------------------------
const getStudentHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        let studentId = req.query.student_id || req.query.child_id;
        let studentDoc = null;

        if (req.user.role === 'Parent') {
            if (studentId) {
                studentDoc = await Student.findOne({ _id: studentId, parent_user_id: req.user._id });
                if (!studentDoc) {
                    return res.status(403).json({ message: 'Unauthorized access to student homework data' });
                }
            } else {
                studentDoc = await Student.findOne({ parent_user_id: req.user._id });
                if (studentDoc) studentId = studentDoc._id;
            }
        } else if (req.user.role === 'Student') {
            studentDoc = await Student.findOne({ user_id: req.user._id });
            if (studentDoc) studentId = studentDoc._id;
        } else if (studentId) {
            studentDoc = await Student.findById(studentId);
        } else {
            studentDoc = await Student.findOne({ school_id });
            if (studentDoc) studentId = studentDoc._id;
        }

        if (!studentDoc || !studentId) {
            return res.json([]);
        }

        // Fetch existing assignments for this student
        let assignments = await HomeworkAssignment.find({ student_id: studentId })
            .populate({
                path: 'homework_id',
                populate: { path: 'assigned_classes', select: 'class class_name section' }
            })
            .sort({ createdAt: -1 });

        // Also check if any active homework exists for student's class that hasn't been assigned yet
        if (studentDoc.class_id) {
            const classHomeworks = await Homework.find({
                assigned_classes: studentDoc.class_id,
                status: 'Active'
            });

            const existingHwIds = new Set(assignments.map(a => a.homework_id?._id?.toString()).filter(Boolean));
            for (const chw of classHomeworks) {
                if (!existingHwIds.has(chw._id.toString())) {
                    if (chw.assigned_section && studentDoc.section && chw.assigned_section !== studentDoc.section) {
                        continue;
                    }
                    const newAssign = await HomeworkAssignment.create({
                        homework_id: chw._id,
                        school_id: studentDoc.school_id,
                        student_id: studentDoc._id,
                        class_id: studentDoc.class_id,
                        status: 'Pending'
                    });
                    const populated = await HomeworkAssignment.findById(newAssign._id).populate({
                        path: 'homework_id',
                        populate: { path: 'assigned_classes', select: 'class class_name section' }
                    });
                    assignments.unshift(populated);
                }
            }
        }

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

        if (!submission_id) return res.status(400).json({ success: false, message: 'Submission ID is required' });

        const submission = await HomeworkSubmission.findById(submission_id).populate('homework_id');
        if (!submission) return res.status(404).json({ success: false, message: 'Homework submission not found' });

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

        res.json({
            success: true,
            message: 'Homework evaluated successfully',
            review,
            data: { review }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getClassHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { classId } = req.params;

        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, school_id);
            if (!authorizedClassIds.includes(classId.toString()) && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You are not authorized to view homework for this class'
                });
            }
        }

        const query = { school_id, assigned_classes: classId };
        if (req.baseUrl.includes('assignment')) {
            query.category = 'Assignment';
        } else if (req.baseUrl.includes('teacher/homework')) {
            query.category = 'Homework';
        }

        const homeworks = await Homework.find(query)
            .populate('assigned_classes', 'class class_name section')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            message: `${query.category || 'Class'} homework retrieved successfully`,
            data: {
                classId,
                totalRecords: homeworks.length,
                homework: homeworks
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getSectionHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { classId, section } = req.params;

        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, school_id);
            if (!authorizedClassIds.includes(classId.toString()) && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You are not authorized to view homework for this class'
                });
            }
        }

        const query = {
            school_id,
            assigned_classes: classId,
            $or: [
                { assigned_section: section },
                { assigned_section: '' },
                { assigned_section: { $exists: false } }
            ]
        };
        if (req.baseUrl.includes('assignment')) {
            query.category = 'Assignment';
        } else if (req.baseUrl.includes('teacher/homework')) {
            query.category = 'Homework';
        }

        const homeworks = await Homework.find(query)
            .populate('assigned_classes', 'class class_name section')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            message: `${query.category || 'Section'} homework retrieved successfully`,
            data: {
                classId,
                section,
                totalRecords: homeworks.length,
                homework: homeworks
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getSubjectHomework = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { subjectId } = req.params;

        const query = { school_id };
        if (mongoose.Types.ObjectId.isValid(subjectId)) {
            query.$or = [
                { subject_id: subjectId },
                { subject_name: new RegExp(subjectId, 'i') }
            ];
        } else {
            query.subject_name = new RegExp(subjectId, 'i');
        }

        if (req.baseUrl.includes('assignment')) {
            query.category = 'Assignment';
        } else if (req.baseUrl.includes('teacher/homework')) {
            query.category = 'Homework';
        }

        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id, teacher?._id, teacher?.user_id].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, school_id);
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { created_by: { $in: teacherIds } },
                    { teacher_id: { $in: teacherIds } },
                    { assigned_classes: { $in: authorizedClassIds } }
                ]
            });
        }

        const homeworks = await Homework.find(query)
            .populate('assigned_classes', 'class class_name section')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            message: `${query.category || 'Subject'} homework retrieved successfully`,
            data: {
                subjectId,
                totalRecords: homeworks.length,
                homework: homeworks
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getHomeworkSubmissions = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const homeworkId = req.params.id || req.query.homework_id;
        const { student_id, class_id, status } = req.query;

        const query = { school_id };
        if (homeworkId) query.homework_id = homeworkId;
        if (student_id) query.student_id = student_id;

        const submissions = await HomeworkSubmission.find(query)
            .populate('homework_id', 'title subject_name due_date max_marks category')
            .populate({
                path: 'student_id',
                select: 'student_name roll_no admission_number class section class_id photo parent_phone parent_name',
                populate: { path: 'class_id', select: 'class section class_name' }
            })
            .sort({ submitted_at: -1 })
            .lean();

        const enriched = await Promise.all(submissions.map(async (sub) => {
            const review = await HomeworkReview.findOne({ submission_id: sub._id })
                .populate('evaluated_by', 'name email role')
                .lean();

            return {
                submissionId: sub._id,
                homeworkId: sub.homework_id?._id,
                homeworkTitle: sub.homework_id?.title || 'N/A',
                subjectName: sub.homework_id?.subject_name || 'N/A',
                dueDate: sub.homework_id?.due_date,
                maxMarks: sub.homework_id?.max_marks || 100,
                studentId: sub.student_id?._id,
                studentName: sub.student_id?.student_name || 'N/A',
                admissionNumber: sub.student_id?.admission_number || 'N/A',
                class: sub.student_id?.class_id?.class || sub.student_id?.class || 'N/A',
                section: sub.student_id?.class_id?.section || sub.student_id?.section || 'N/A',
                submissionNotes: sub.submission_notes || '',
                attachmentUrl: sub.attachment_url || '',
                document: sub.attachment_url || '',
                submittedAt: sub.submitted_at,
                submissionDate: sub.submitted_at,
                isLate: sub.is_late || false,
                submissionStatus: review ? 'Reviewed' : (sub.is_late ? 'Late' : 'Submitted'),
                marksObtained: review?.marks_obtained !== undefined ? review.marks_obtained : null,
                teacherRemarks: review?.remarks || '',
                evaluatedBy: review?.evaluated_by?.name || null,
                evaluatedAt: review?.evaluated_at || null,
                createdDate: sub.createdAt,
                updatedDate: sub.updatedAt
            };
        }));

        let filtered = enriched;
        if (status) {
            filtered = filtered.filter(s => s.submissionStatus.toLowerCase() === status.toLowerCase());
        }
        if (class_id) {
            filtered = filtered.filter(s => s.class === class_id);
        }

        res.json({
            success: true,
            message: 'Homework submissions retrieved successfully',
            data: {
                submissions: filtered,
                totalRecords: filtered.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getSubmissionById = async (req, res) => {
    try {
        const submission = await HomeworkSubmission.findById(req.params.id)
            .populate('homework_id', 'title description subject_name due_date max_marks category instructions')
            .populate({
                path: 'student_id',
                select: 'student_name roll_no admission_number class section class_id photo parent_phone parent_name',
                populate: { path: 'class_id', select: 'class section class_name' }
            })
            .lean();

        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        const review = await HomeworkReview.findOne({ submission_id: submission._id })
            .populate('evaluated_by', 'name email role')
            .lean();

        const data = {
            submissionId: submission._id,
            homeworkId: submission.homework_id?._id,
            homeworkTitle: submission.homework_id?.title || 'N/A',
            description: submission.homework_id?.description || '',
            instructions: submission.homework_id?.instructions || '',
            subjectName: submission.homework_id?.subject_name || 'N/A',
            dueDate: submission.homework_id?.due_date,
            maxMarks: submission.homework_id?.max_marks || 100,
            studentId: submission.student_id?._id,
            studentName: submission.student_id?.student_name || 'N/A',
            admissionNumber: submission.student_id?.admission_number || 'N/A',
            class: submission.student_id?.class_id?.class || submission.student_id?.class || 'N/A',
            section: submission.student_id?.class_id?.section || submission.student_id?.section || 'N/A',
            submissionNotes: submission.submission_notes || '',
            attachmentUrl: submission.attachment_url || '',
            document: submission.attachment_url || '',
            submittedAt: submission.submitted_at,
            submissionDate: submission.submitted_at,
            isLate: submission.is_late || false,
            submissionStatus: review ? 'Reviewed' : (submission.is_late ? 'Late' : 'Submitted'),
            marksObtained: review?.marks_obtained !== undefined ? review.marks_obtained : null,
            teacherRemarks: review?.remarks || '',
            evaluatedBy: review?.evaluated_by?.name || null,
            evaluatedAt: review?.evaluated_at || null,
            createdDate: submission.createdAt,
            updatedDate: submission.updatedAt
        };

        res.json({
            success: true,
            message: 'Submission details retrieved successfully',
            data: { submission: data }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getPendingSubmissions = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { class_id, homework_id } = req.query;

        const query = { school_id, status: 'Pending' };
        if (homework_id) query.homework_id = homework_id;
        if (class_id) query.class_id = class_id;

        const pendingAssignments = await HomeworkAssignment.find(query)
            .populate('homework_id', 'title subject_name due_date max_marks creator_name')
            .populate({
                path: 'student_id',
                select: 'student_name roll_no admission_number class section class_id parent_name parent_phone photo',
                populate: { path: 'class_id', select: 'class section class_name' }
            })
            .sort({ createdAt: -1 })
            .lean();

        const pendingList = pendingAssignments
            .filter(a => a.student_id && a.homework_id)
            .map(a => {
                const now = new Date();
                const dueDate = new Date(a.homework_id.due_date);
                const isOverdue = now > dueDate;
                const diffTime = Math.abs(dueDate - now);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return {
                    assignmentId: a._id,
                    homeworkId: a.homework_id._id,
                    homeworkTitle: a.homework_id.title,
                    subjectName: a.homework_id.subject_name,
                    dueDate: a.homework_id.due_date,
                    submissionDate: a.homework_id.due_date,
                    teacherName: a.homework_id.creator_name || 'Teacher/Admin',
                    studentId: a.student_id._id,
                    studentName: a.student_id.student_name,
                    admissionNumber: a.student_id.admission_number,
                    class: a.student_id.class_id?.class || a.student_id.class || 'N/A',
                    section: a.student_id.class_id?.section || a.student_id.section || 'N/A',
                    parentName: a.student_id.parent_name || 'N/A',
                    parentPhone: a.student_id.parent_phone || 'N/A',
                    submissionStatus: isOverdue ? 'Overdue' : 'Pending',
                    isOverdue,
                    daysRemaining: isOverdue ? -diffDays : diffDays
                };
            });

        res.json({
            success: true,
            message: 'Pending homework submissions retrieved successfully',
            data: {
                totalPending: pendingList.length,
                pendingSubmissions: pendingList
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getCompletedSubmissions = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { homework_id, class_id } = req.query;

        const query = { school_id };
        if (homework_id) query.homework_id = homework_id;

        const submissions = await HomeworkSubmission.find(query)
            .populate('homework_id', 'title subject_name due_date max_marks')
            .populate({
                path: 'student_id',
                select: 'student_name roll_no admission_number class section class_id photo',
                populate: { path: 'class_id', select: 'class section class_name' }
            })
            .sort({ submitted_at: -1 })
            .lean();

        const completedList = await Promise.all(submissions.map(async (sub) => {
            const review = await HomeworkReview.findOne({ submission_id: sub._id })
                .populate('evaluated_by', 'name email')
                .lean();

            return {
                submissionId: sub._id,
                homeworkId: sub.homework_id?._id,
                homeworkTitle: sub.homework_id?.title || 'N/A',
                subjectName: sub.homework_id?.subject_name || 'N/A',
                studentId: sub.student_id?._id,
                studentName: sub.student_id?.student_name || 'N/A',
                admissionNumber: sub.student_id?.admission_number || 'N/A',
                class: sub.student_id?.class_id?.class || sub.student_id?.class || 'N/A',
                section: sub.student_id?.class_id?.section || sub.student_id?.section || 'N/A',
                submissionNotes: sub.submission_notes || '',
                attachmentUrl: sub.attachment_url || '',
                submittedAt: sub.submitted_at,
                submissionStatus: review ? 'Reviewed' : 'Submitted',
                marksObtained: review?.marks_obtained !== undefined ? review.marks_obtained : null,
                maxMarks: sub.homework_id?.max_marks || 100,
                teacherRemarks: review?.remarks || '',
                evaluatedBy: review?.evaluated_by?.name || null
            };
        }));

        res.json({
            success: true,
            message: 'Completed homework submissions retrieved successfully',
            data: {
                totalCompleted: completedList.length,
                completedSubmissions: completedList
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getSubmissionAttachments = async (req, res) => {
    try {
        const submission = await HomeworkSubmission.findById(req.params.id)
            .populate('homework_id', 'title subject_name')
            .populate('student_id', 'student_name admission_number')
            .lean();

        if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

        res.json({
            success: true,
            message: 'Submission attachments retrieved successfully',
            data: {
                submissionId: submission._id,
                homeworkTitle: submission.homework_id?.title || '',
                studentName: submission.student_id?.student_name || '',
                attachmentUrl: submission.attachment_url || '',
                hasAttachment: Boolean(submission.attachment_url)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

const getHomeworkSummaryReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);

        const totalHomework = await Homework.countDocuments({ school_id });
        const totalAssignments = await HomeworkAssignment.countDocuments({ school_id });
        const totalSubmissions = await HomeworkSubmission.countDocuments({ school_id });
        const totalReviewed = await HomeworkReview.countDocuments({ school_id });
        const totalLate = await HomeworkSubmission.countDocuments({ school_id, is_late: true });
        const pendingSubmissions = Math.max(0, totalAssignments - totalSubmissions);
        const completionRate = totalAssignments > 0 ? parseFloat(((totalSubmissions / totalAssignments) * 100).toFixed(1)) : 0;

        res.json({
            success: true,
            message: 'Homework summary report retrieved successfully',
            data: {
                totalHomework,
                totalAssignments,
                totalSubmissions,
                totalReviewed,
                pendingSubmissions,
                totalLate,
                completionRate
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getStudentHomeworkReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { student_id, class_id } = req.query;

        let studentQuery = { school_id };
        if (student_id) studentQuery._id = student_id;
        if (class_id) studentQuery.class_id = class_id;

        const students = await Student.find(studentQuery)
            .select('student_name roll_no admission_number class section class_id photo')
            .lean();

        const report = await Promise.all(students.map(async (st) => {
            const assigned = await HomeworkAssignment.find({ student_id: st._id }).lean();
            const totalAssigned = assigned.length;
            const submitted = await HomeworkSubmission.find({ student_id: st._id }).lean();
            const totalSubmitted = submitted.length;
            const reviews = await HomeworkReview.find({ student_id: st._id }).lean();
            const totalReviewed = reviews.length;
            const pending = Math.max(0, totalAssigned - totalSubmitted);
            const completionRate = totalAssigned > 0 ? parseFloat(((totalSubmitted / totalAssigned) * 100).toFixed(1)) : 0;

            const totalMarksObtained = reviews.reduce((sum, r) => sum + (Number(r.marks_obtained) || 0), 0);
            const averageScore = totalReviewed > 0 ? parseFloat((totalMarksObtained / totalReviewed).toFixed(1)) : 0;

            return {
                studentId: st._id,
                studentName: st.student_name,
                admissionNumber: st.admission_number,
                class: st.class,
                section: st.section,
                totalAssigned,
                totalSubmitted,
                totalReviewed,
                pendingSubmissions: pending,
                completionRate,
                averageScore
            };
        }));

        res.json({
            success: true,
            message: 'Student-wise homework report retrieved successfully',
            data: {
                totalStudents: report.length,
                studentsReport: report
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getClassHomeworkReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const classes = await Class.find({ school_id }).sort({ class: 1, section: 1 }).lean();

        const classReports = await Promise.all(classes.map(async (cls) => {
            const studentsInClass = await Student.find({ class_id: cls._id }).select('_id').lean();
            const studentIds = studentsInClass.map(s => s._id);

            const totalHomework = await Homework.countDocuments({
                school_id,
                assigned_classes: cls._id
            });

            const totalAssignments = await HomeworkAssignment.countDocuments({
                school_id,
                student_id: { $in: studentIds }
            });

            const totalSubmissions = await HomeworkSubmission.countDocuments({
                school_id,
                student_id: { $in: studentIds }
            });

            const pending = Math.max(0, totalAssignments - totalSubmissions);
            const completionRate = totalAssignments > 0 ? parseFloat(((totalSubmissions / totalAssignments) * 100).toFixed(1)) : 0;

            return {
                classId: cls._id,
                className: cls.class,
                section: cls.section,
                totalStudents: studentIds.length,
                totalHomework,
                totalAssignments,
                totalSubmissions,
                pendingSubmissions: pending,
                completionRate
            };
        }));

        res.json({
            success: true,
            message: 'Class-wise homework report retrieved successfully',
            data: {
                totalClasses: classReports.length,
                classesReport: classReports
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getSubmissionStatusReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);

        const totalAssignments = await HomeworkAssignment.countDocuments({ school_id });
        const pendingCount = await HomeworkAssignment.countDocuments({ school_id, status: 'Pending' });
        const submittedCount = await HomeworkSubmission.countDocuments({ school_id });
        const reviewedCount = await HomeworkReview.countDocuments({ school_id });
        const lateCount = await HomeworkSubmission.countDocuments({ school_id, is_late: true });

        const statusReport = {
            totalAssignments,
            statusCounts: {
                Pending: pendingCount,
                Submitted: submittedCount,
                Reviewed: reviewedCount,
                Late: lateCount
            },
            statusPercentages: {
                Pending: totalAssignments > 0 ? parseFloat(((pendingCount / totalAssignments) * 100).toFixed(1)) : 0,
                Submitted: totalAssignments > 0 ? parseFloat(((submittedCount / totalAssignments) * 100).toFixed(1)) : 0,
                Reviewed: totalAssignments > 0 ? parseFloat(((reviewedCount / totalAssignments) * 100).toFixed(1)) : 0,
                Late: totalAssignments > 0 ? parseFloat(((lateCount / totalAssignments) * 100).toFixed(1)) : 0
            }
        };

        res.json({
            success: true,
            message: 'Submission status report retrieved successfully',
            data: statusReport
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
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

// ----------------------------------------------------
// 5. Update Status & Submission Status Details
// ----------------------------------------------------
const updateHomeworkStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const validStatuses = ['Active', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values are: ${validStatuses.join(', ')}`
            });
        }

        const homework = await Homework.findById(id);
        if (!homework) {
            return res.status(404).json({ success: false, message: 'Homework / Assignment not found' });
        }

        // Authorization check for teachers
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id?.toString(), teacher?._id?.toString(), teacher?.user_id?.toString()].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, homework.school_id);
            const isCreator = teacherIds.includes(homework.created_by?.toString()) || teacherIds.includes(homework.teacher_id?.toString());
            const hasAssignedClass = homework.assigned_classes?.some(cid => authorizedClassIds.includes(cid.toString()));

            if (!isCreator && !hasAssignedClass && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You are not authorized to update the status of this homework/assignment'
                });
            }
        }

        homework.status = status;
        await homework.save();

        res.json({
            success: true,
            message: `${homework.category || 'Homework'} status updated to ${status} successfully`,
            data: {
                homeworkId: homework._id,
                title: homework.title,
                category: homework.category || 'Homework',
                status: homework.status,
                updatedAt: homework.updatedAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

const getHomeworkSubmissionStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const homework = await Homework.findById(id)
            .populate('assigned_classes', 'class class_name section')
            .populate('created_by', 'name email');

        if (!homework) {
            return res.status(404).json({ success: false, message: 'Homework / Assignment not found' });
        }

        // Authorization check for teachers
        if (req.user && req.user.role === 'Teacher') {
            const teacher = await getTeacherProfileHelper(req.user._id);
            const teacherIds = [req.user._id?.toString(), teacher?._id?.toString(), teacher?.user_id?.toString()].filter(Boolean);
            const authorizedClassIds = await getTeacherClassIdsHelper(teacher?._id || req.user._id, homework.school_id);
            const isCreator = teacherIds.includes(homework.created_by?._id?.toString()) ||
                              teacherIds.includes(homework.created_by?.toString()) ||
                              teacherIds.includes(homework.teacher_id?.toString());
            const hasClass = homework.assigned_classes?.some(c => authorizedClassIds.includes(c._id ? c._id.toString() : c.toString()));

            if (!isCreator && !hasClass && authorizedClassIds.length > 0) {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: You do not have permission to view submission status for this homework/assignment'
                });
            }
        }

        const assignments = await HomeworkAssignment.find({ homework_id: homework._id })
            .populate({
                path: 'student_id',
                select: 'student_name roll_no admission_number class section class_id photo parent_phone parent_name',
                populate: { path: 'class_id', select: 'class section class_name' }
            })
            .lean();

        const submissions = await HomeworkSubmission.find({ homework_id: homework._id }).lean();
        const submissionMap = new Map(submissions.map(s => [s.student_id?.toString(), s]));

        const reviews = await HomeworkReview.find({ homework_id: homework._id }).lean();
        const reviewMap = new Map(reviews.map(r => [r.student_id?.toString(), r]));

        const studentStatusList = assignments.map(a => {
            const st = a.student_id;
            if (!st) return null;
            const sub = submissionMap.get(st._id.toString());
            const rev = reviewMap.get(st._id.toString());

            let currentStatus = a.status || 'Pending';
            if (rev) currentStatus = 'Reviewed';
            else if (sub) currentStatus = sub.is_late ? 'Late' : 'Submitted';

            return {
                assignmentId: a._id,
                studentId: st._id,
                studentName: st.student_name,
                admissionNumber: st.admission_number,
                rollNo: st.roll_no || null,
                class: st.class_id?.class || st.class || 'N/A',
                section: st.class_id?.section || st.section || 'N/A',
                status: currentStatus,
                submittedAt: sub?.submitted_at || null,
                attachmentUrl: sub?.attachment_url || '',
                submissionNotes: sub?.submission_notes || '',
                isLate: sub?.is_late || false,
                marksObtained: rev?.marks_obtained !== undefined ? rev.marks_obtained : null,
                maxMarks: homework.max_marks || 100,
                teacherRemarks: rev?.remarks || '',
                evaluatedAt: rev?.evaluated_at || null
            };
        }).filter(Boolean);

        const totalAssigned = studentStatusList.length;
        const totalSubmitted = studentStatusList.filter(s => ['Submitted', 'Reviewed', 'Late'].includes(s.status)).length;
        const totalReviewed = studentStatusList.filter(s => s.status === 'Reviewed').length;
        const totalLate = studentStatusList.filter(s => s.isLate || s.status === 'Late').length;
        const pendingSubmissions = Math.max(0, totalAssigned - totalSubmitted);
        const submissionRate = totalAssigned > 0 ? parseFloat(((totalSubmitted / totalAssigned) * 100).toFixed(1)) : 0;

        const firstClass = homework.assigned_classes && homework.assigned_classes.length > 0 ? homework.assigned_classes[0] : null;

        res.json({
            success: true,
            message: 'Homework submission status retrieved successfully',
            data: {
                homeworkId: homework._id,
                title: homework.title,
                category: homework.category || 'Homework',
                subjectName: homework.subject_name,
                className: firstClass?.class || firstClass?.class_name || 'N/A',
                sectionName: homework.assigned_section || firstClass?.section || 'All',
                assignedDate: homework.assigned_date,
                dueDate: homework.due_date,
                submissionDate: homework.due_date,
                status: homework.status,
                totalStudents: totalAssigned,
                submittedStudents: totalSubmitted,
                pendingStudents: pendingSubmissions,
                reviewedStudents: totalReviewed,
                lateStudents: totalLate,
                submissionRate,
                students: studentStatusList
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    createHomework,
    getHomeworkList,
    getHomeworkById,
    updateHomework,
    deleteHomework,
    getClassHomework,
    getSectionHomework,
    getSubjectHomework,
    getHomeworkSubmissions,
    getSubmissionById,
    getPendingSubmissions,
    getCompletedSubmissions,
    getSubmissionAttachments,
    getStudentHomework,
    submitHomework,
    evaluateSubmission,
    getHomeworkStats,
    getHomeworkSummaryReport,
    getStudentHomeworkReport,
    getClassHomeworkReport,
    getSubmissionStatusReport,
    getHomeworkNotifications,
    updateHomeworkStatus,
    getHomeworkSubmissionStatus
};
