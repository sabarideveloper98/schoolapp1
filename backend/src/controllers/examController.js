const Exam = require('../models/Exam');
const ExamMark = require('../models/ExamMark');
const School = require('../models/School');
const Student = require('../models/Student');
const ClassSubject = require('../models/ClassSubject');
const Subject = require('../models/Subject');

const getSchoolId = async (adminId) => {
    const school = await School.findOne({ admin_id: adminId });
    if (!school) throw new Error('School not found for this admin');
    return school._id;
};

const calculateGrade = (percentage) => {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    return 'F';
};

// @desc    Get all exams
// @route   GET /api/schooladmin/exams
// @access  Private (SchoolAdmin only)
const getExams = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const exams = await Exam.find({ school_id }).sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create an exam
// @route   POST /api/schooladmin/exams
// @access  Private (SchoolAdmin only)
const createExam = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { name, term } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Exam name is required' });
        }

        const exam = await Exam.create({ school_id, name, term });
        res.status(201).json(exam);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'An exam with this name already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get students & existing marks for mark entry page
// @route   GET /api/schooladmin/exam-marks
// @access  Private (SchoolAdmin only)
const getExamStudentsMarks = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { exam_id, class_id } = req.query;

        if (!exam_id || !class_id) {
            return res.status(400).json({ message: 'Exam ID and Class ID are required' });
        }

        // Fetch subjects assigned to this class standard & section
        const classSubjects = await ClassSubject.find({ class_id, school_id }).populate('subject_id');
        let subjects = classSubjects.map(cs => cs.subject_id).filter(Boolean);

        // Fallback: If no subjects are configured for this class standard, fetch all school subjects
        if (subjects.length === 0) {
            subjects = await Subject.find({ school_id });
        }

        // Fetch students in class
        const students = await Student.find({ school_id, class_id }).select('student_name roll_no admission_number photo');

        // Fetch any existing marks recorded for this exam
        const existingMarks = await ExamMark.find({ exam_id, class_id });

        // Map students to structure marks list
        const studentsWithMarks = students.map(s => {
            const match = existingMarks.find(em => em.student_id.toString() === s._id.toString());
            return {
                student_id: s._id,
                name: s.student_name,
                roll_no: s.roll_no || '',
                admission_number: s.admission_number || s._id.toString().substring(0, 16).toUpperCase(),
                photo: s.photo || '',
                marks: match ? match.marks : []
            };
        });

        res.json({
            students: studentsWithMarks,
            subjects
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Save student marks for exam
// @route   POST /api/schooladmin/exam-marks
// @access  Private (SchoolAdmin only)
const saveExamMarks = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { exam_id, class_id, student_marks } = req.body;

        if (!exam_id || !class_id || !student_marks) {
            return res.status(400).json({ message: 'Exam ID, Class ID, and Student Marks list are required' });
        }

        const promises = student_marks.map(sm => {
            return ExamMark.findOneAndUpdate(
                { exam_id, student_id: sm.student_id },
                {
                    exam_id,
                    class_id,
                    student_id: sm.student_id,
                    school_id,
                    marks: sm.marks
                },
                { upsert: true, new: true }
            );
        });

        await Promise.all(promises);
        res.json({ message: 'Marks updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get exam report
// @route   GET /api/schooladmin/exam-report
// @access  Private (SchoolAdmin only)
const getExamReport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { exam_id, class_id, student_id } = req.query;

        if (!exam_id || !class_id) {
            return res.status(400).json({ message: 'Exam ID and Class ID are required' });
        }

        // Fetch subjects
        const classSubjects = await ClassSubject.find({ class_id, school_id }).populate('subject_id');
        let subjects = classSubjects.map(cs => cs.subject_id).filter(Boolean);
        if (subjects.length === 0) {
            subjects = await Subject.find({ school_id });
        }

        let studentsQuery = { school_id, class_id };
        if (student_id) {
            studentsQuery._id = student_id;
        }

        const students = await Student.find(studentsQuery).select('student_name roll_no admission_number photo');
        const examMarks = await ExamMark.find({ exam_id, class_id });

        const summary = students.map(s => {
            const match = examMarks.find(em => em.student_id.toString() === s._id.toString());
            let totalObtained = 0;
            let totalMax = 0;

            const subject_marks = subjects.map(sub => {
                const markEntry = match ? match.marks.find(m => m.subject_id.toString() === sub._id.toString()) : null;
                const score = markEntry ? markEntry.marks_obtained : 0;
                const max = markEntry ? markEntry.total_marks : 100;
                
                totalObtained += score;
                totalMax += max;

                return {
                    subject_id: sub._id,
                    subject_name: sub.name,
                    subject_code: sub.code,
                    marks_obtained: score,
                    total_marks: max,
                    percentage: max > 0 ? Math.round((score / max) * 100) : 0,
                    grade: calculateGrade(max > 0 ? Math.round((score / max) * 100) : 0)
                };
            });

            const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;

            return {
                student_id: s._id,
                name: s.student_name,
                roll_no: s.roll_no || '',
                admission_number: s.admission_number || s._id.toString().substring(0, 16).toUpperCase(),
                photo: s.photo || '',
                subject_marks,
                total_obtained: totalObtained,
                total_max: totalMax,
                percentage,
                grade: calculateGrade(percentage)
            };
        });

        res.json({
            subjects,
            summary
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getExams,
    createExam,
    getExamStudentsMarks,
    saveExamMarks,
    getExamReport
};
