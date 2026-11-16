const Exam = require('../models/Exam');
const ExamMark = require('../models/ExamMark');
const School = require('../models/School');
const Student = require('../models/Student');
const ClassSubject = require('../models/ClassSubject');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const mongoose = require('mongoose');

const getSchoolId = async (adminId) => {
    let school = await School.findOne({ admin_id: adminId });
    if (school) return school._id;
    const anySchool = await School.findOne({});
    if (anySchool) return anySchool._id;
    school = await School.create({
        admin_id: adminId,
        name: 'Default International School',
        code: 'SCH001'
    });
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

// @desc    Add / Save student marks for exam
// @route   POST /api/schooladmin/exam-marks (aliases: /marks, /add-marks)
// @access  Private (SchoolAdmin only)
const saveExamMarks = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);

        // -------------------------------------------------------------
        // FORMAT A: Legacy Bulk Grid Format (from frontend AddMarks.jsx)
        // Body: { exam_id, class_id, student_marks: [ { student_id, marks: [ { subject_id, marks_obtained, total_marks } ] } ] }
        // -------------------------------------------------------------
        if (req.body.student_marks && Array.isArray(req.body.student_marks)) {
            const { exam_id, class_id, student_marks } = req.body;

            if (!exam_id || !class_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Exam ID and Class ID are required'
                });
            }

            // Validate marks in each student record
            for (const sm of student_marks) {
                if (Array.isArray(sm.marks)) {
                    for (const m of sm.marks) {
                        const obt = Number(m.marks_obtained);
                        const max = Number(m.total_marks || m.max_marks || 100);
                        if (!isNaN(obt) && !isNaN(max) && obt > max) {
                            return res.status(400).json({
                                success: false,
                                message: `Obtained marks (${obt}) cannot exceed maximum marks (${max})`
                            });
                        }
                    }
                }
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
            return res.json({
                success: true,
                message: 'Marks updated successfully',
                data: {
                    count: student_marks.length
                }
            });
        }

        // -------------------------------------------------------------
        // FORMAT B: Individual Student Marks Entry (Single or Multi-Subject)
        // -------------------------------------------------------------
        const studentParam = req.body.studentId || req.body.student_id || req.body.student;
        const admissionNumParam = req.body.admissionNumber || req.body.admission_number;
        const examParam = req.body.examId || req.body.exam_id || req.body.exam;
        const examNameParam = req.body.examName || req.body.exam_name || req.body.examinationName || req.body.examination_name;
        const classParam = req.body.classId || req.body.class_id || req.body.class;
        const sectionParam = req.body.sectionId || req.body.section_id || req.body.section;
        const academicYearParam = req.body.academicYearId || req.body.academic_year_id || req.body.academicYear || req.body.academic_year;
        const subjectParam = req.body.subjectId || req.body.subject_id || req.body.subject;
        const subjectNameParam = req.body.subjectName || req.body.subject_name;
        const marksArray = req.body.marks;
        const globalRemarks = req.body.remarks || '';

        // 1. Resolve Student
        if (!studentParam && !admissionNumParam) {
            return res.status(400).json({
                success: false,
                message: 'Student ID or Admission Number is required'
            });
        }

        let student = null;
        if (studentParam && mongoose.Types.ObjectId.isValid(studentParam)) {
            student = await Student.findOne({ _id: studentParam, school_id }).populate('class_id');
        }
        if (!student) {
            student = await Student.findOne({
                admission_number: admissionNumParam || studentParam,
                school_id
            }).populate('class_id');
        }

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found in this school'
            });
        }

        // 2. Resolve Class
        let classDoc = null;
        if (classParam && mongoose.Types.ObjectId.isValid(classParam)) {
            classDoc = await Class.findOne({ _id: classParam, school_id });
        }
        if (!classDoc && student.class_id) {
            if (student.class_id._id) {
                classDoc = student.class_id;
            } else {
                classDoc = await Class.findById(student.class_id);
            }
        }
        if (!classDoc && classParam) {
            const classQuery = { school_id, class: classParam };
            if (sectionParam) classQuery.section = sectionParam;
            classDoc = await Class.findOne(classQuery);
        }

        const classId = classDoc ? classDoc._id : student.class_id;
        if (!classId) {
            return res.status(400).json({
                success: false,
                message: 'Class ID is required'
            });
        }

        // 3. Resolve Exam
        if (!examParam && !examNameParam) {
            return res.status(400).json({
                success: false,
                message: 'Exam ID or Examination Name is required'
            });
        }

        let exam = null;
        if (examParam && mongoose.Types.ObjectId.isValid(examParam)) {
            exam = await Exam.findOne({ _id: examParam, school_id });
        }
        if (!exam && (examNameParam || examParam)) {
            exam = await Exam.findOne({
                name: examNameParam || examParam,
                school_id
            });
        }
        if (!exam && examNameParam) {
            exam = await Exam.create({
                name: examNameParam,
                school_id,
                term: req.body.term || 'Term 1'
            });
        }

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found in this school'
            });
        }

        // 4. Resolve Subjects & Validate Marks
        const itemsToSave = [];

        if (Array.isArray(marksArray) && marksArray.length > 0) {
            // Multi-subject marks array
            for (let i = 0; i < marksArray.length; i++) {
                const item = marksArray[i];
                const subId = item.subjectId || item.subject_id || item.subject;
                const subName = item.subjectName || item.subject_name;

                let subject = null;
                if (subId && mongoose.Types.ObjectId.isValid(subId)) {
                    subject = await Subject.findOne({ _id: subId, school_id });
                }
                if (!subject && subName) {
                    subject = await Subject.findOne({ name: subName, school_id });
                }

                if (!subject) {
                    return res.status(404).json({
                        success: false,
                        message: `Subject not found for item at index ${i}`
                    });
                }

                const obtRaw = item.obtainedMarks ?? item.obtained_marks ?? item.marks_obtained;
                if (obtRaw === undefined || obtRaw === null || obtRaw === '') {
                    return res.status(400).json({
                        success: false,
                        message: `Obtained marks are required for subject ${subject.name}`
                    });
                }

                const obt = Number(obtRaw);
                const max = Number(item.maximumMarks ?? item.maximum_marks ?? item.total_marks ?? item.max_marks ?? 100);
                const pass = Number(item.passingMarks ?? item.passing_marks ?? 35);

                if (isNaN(obt) || obt < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Obtained marks must be a non-negative number for subject ${subject.name}`
                    });
                }
                if (isNaN(max) || max <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Maximum marks must be greater than zero for subject ${subject.name}`
                    });
                }
                if (obt > max) {
                    return res.status(400).json({
                        success: false,
                        message: `Obtained marks (${obt}) cannot exceed maximum marks (${max}) for subject ${subject.name}`
                    });
                }
                if (pass > max || pass < 0) {
                    return res.status(400).json({
                        success: false,
                        message: `Passing marks (${pass}) must be between 0 and maximum marks (${max}) for subject ${subject.name}`
                    });
                }

                const percentage = max > 0 ? Math.round((obt / max) * 100) : 0;
                const grade = item.grade ? item.grade.toString().trim() : calculateGrade(percentage);

                itemsToSave.push({
                    subject_id: subject._id,
                    subject_name: subject.name,
                    marks_obtained: obt,
                    total_marks: max,
                    passing_marks: pass,
                    grade,
                    remarks: item.remarks || globalRemarks || '',
                    exam_date: item.examDate || item.exam_date ? new Date(item.examDate || item.exam_date) : undefined
                });
            }
        } else {
            // Single subject
            let subject = null;
            if (subjectParam && mongoose.Types.ObjectId.isValid(subjectParam)) {
                subject = await Subject.findOne({ _id: subjectParam, school_id });
            }
            if (!subject && (subjectNameParam || subjectParam)) {
                subject = await Subject.findOne({ name: subjectNameParam || subjectParam, school_id });
            }

            if (!subject) {
                return res.status(404).json({
                    success: false,
                    message: 'Subject not found in this school'
                });
            }

            const obtRaw = req.body.obtainedMarks ?? req.body.obtained_marks ?? req.body.marks_obtained;
            if (obtRaw === undefined || obtRaw === null || obtRaw === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Obtained marks are required'
                });
            }

            const obt = Number(obtRaw);
            const max = Number(req.body.maximumMarks ?? req.body.maximum_marks ?? req.body.total_marks ?? req.body.max_marks ?? 100);
            const pass = Number(req.body.passingMarks ?? req.body.passing_marks ?? 35);

            if (isNaN(obt) || obt < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Obtained marks must be a non-negative number'
                });
            }
            if (isNaN(max) || max <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Maximum marks must be greater than zero'
                });
            }
            if (obt > max) {
                return res.status(400).json({
                    success: false,
                    message: `Obtained marks (${obt}) cannot exceed maximum marks (${max})`
                });
            }
            if (pass > max || pass < 0) {
                return res.status(400).json({
                    success: false,
                    message: `Passing marks (${pass}) must be between 0 and maximum marks (${max})`
                });
            }

            const percentage = max > 0 ? Math.round((obt / max) * 100) : 0;
            const grade = req.body.grade ? req.body.grade.toString().trim() : calculateGrade(percentage);

            itemsToSave.push({
                subject_id: subject._id,
                subject_name: subject.name,
                marks_obtained: obt,
                total_marks: max,
                passing_marks: pass,
                grade,
                remarks: req.body.remarks || globalRemarks || '',
                exam_date: req.body.examDate || req.body.exam_date ? new Date(req.body.examDate || req.body.exam_date) : undefined
            });
        }

        // 5. Database Save & Duplicate Prevention
        let examMarkDoc = await ExamMark.findOne({
            exam_id: exam._id,
            student_id: student._id
        });

        const targetAcademicYear = academicYearParam || student.academic_year || '2026-2027';

        if (!examMarkDoc) {
            examMarkDoc = new ExamMark({
                exam_id: exam._id,
                student_id: student._id,
                class_id: classId,
                school_id,
                academic_year: targetAcademicYear,
                remarks: globalRemarks,
                marks: []
            });
        } else {
            examMarkDoc.class_id = classId;
            if (academicYearParam) examMarkDoc.academic_year = academicYearParam;
            if (globalRemarks) examMarkDoc.remarks = globalRemarks;
        }

        // Upsert subject marks into marks array (prevents duplicate entries for the same subject)
        itemsToSave.forEach(newItem => {
            const existingIdx = examMarkDoc.marks.findIndex(
                m => m.subject_id.toString() === newItem.subject_id.toString()
            );

            if (existingIdx >= 0) {
                examMarkDoc.marks[existingIdx].marks_obtained = newItem.marks_obtained;
                examMarkDoc.marks[existingIdx].total_marks = newItem.total_marks;
                examMarkDoc.marks[existingIdx].passing_marks = newItem.passing_marks;
                examMarkDoc.marks[existingIdx].grade = newItem.grade;
                if (newItem.remarks) examMarkDoc.marks[existingIdx].remarks = newItem.remarks;
                if (newItem.exam_date) examMarkDoc.marks[existingIdx].exam_date = newItem.exam_date;
            } else {
                examMarkDoc.marks.push({
                    subject_id: newItem.subject_id,
                    marks_obtained: newItem.marks_obtained,
                    total_marks: newItem.total_marks,
                    passing_marks: newItem.passing_marks,
                    grade: newItem.grade,
                    remarks: newItem.remarks,
                    exam_date: newItem.exam_date
                });
            }
        });

        await examMarkDoc.save();

        // 6. Response Construction
        const className = classDoc ? (classDoc.class || classDoc.name || '') : (student.class || '');
        const sectionName = classDoc ? (classDoc.section || '') : (student.section || '');

        let responseData;
        if (itemsToSave.length === 1) {
            const first = itemsToSave[0];
            responseData = {
                studentId: student._id.toString(),
                studentName: student.student_name,
                admissionNumber: student.admission_number || '',
                class: className,
                section: sectionName,
                academicYear: examMarkDoc.academic_year || targetAcademicYear,
                examId: exam._id.toString(),
                examName: exam.name,
                subjectId: first.subject_id.toString(),
                subjectName: first.subject_name,
                maximumMarks: first.total_marks,
                passingMarks: first.passing_marks,
                obtainedMarks: first.marks_obtained,
                grade: first.grade,
                remarks: first.remarks || '',
                examDate: first.exam_date || null
            };
        } else {
            responseData = {
                studentId: student._id.toString(),
                studentName: student.student_name,
                admissionNumber: student.admission_number || '',
                class: className,
                section: sectionName,
                academicYear: examMarkDoc.academic_year || targetAcademicYear,
                examId: exam._id.toString(),
                examName: exam.name,
                marks: itemsToSave.map(item => ({
                    subjectId: item.subject_id.toString(),
                    subjectName: item.subject_name,
                    maximumMarks: item.total_marks,
                    passingMarks: item.passing_marks,
                    obtainedMarks: item.marks_obtained,
                    grade: item.grade,
                    remarks: item.remarks || '',
                    examDate: item.exam_date || null
                }))
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Student marks added successfully',
            data: responseData
        });
    } catch (error) {
        console.error('saveExamMarks error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while saving marks',
            error: error.message
        });
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

// @desc    Bulk Import Student Exam Marks
// @route   POST /api/schooladmin/exam-marks/bulk-import
// @access  Private (SchoolAdmin / Teacher)
const bulkImportExamMarks = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user._id);
        const { exam_id, class_id, subject_id, marks_data } = req.body;

        if (!exam_id || !class_id || !Array.isArray(marks_data)) {
            return res.status(400).json({ message: 'Exam ID, Class ID, and marks_data array are required' });
        }

        const createdMarks = [];
        const errors = [];

        const subjects = await Subject.find({ school_id });
        const students = await Student.find({ school_id, class_id });

        for (let i = 0; i < marks_data.length; i++) {
            const item = marks_data[i];
            try {
                const student = students.find(s =>
                    (item.student_id && s._id.toString() === item.student_id.toString()) ||
                    (item.roll_no && String(s.roll_no) === String(item.roll_no)) ||
                    (item.admission_number && String(s.admission_number) === String(item.admission_number))
                );

                if (!student) {
                    errors.push({ row: i + 1, message: `Student not found for Roll/Adm No: ${item.roll_no || item.admission_number || item.student_id}` });
                    continue;
                }

                let marksList = item.marks || [];
                if (marksList.length === 0 && (subject_id || item.subject_id || item.subject_name)) {
                    let sub = subjects.find(s =>
                        (subject_id && s._id.toString() === subject_id.toString()) ||
                        (item.subject_id && s._id.toString() === item.subject_id.toString()) ||
                        (item.subject_name && s.name.toLowerCase() === item.subject_name.toLowerCase())
                    );
                    if (sub) {
                        marksList = [{
                            subject_id: sub._id,
                            marks_obtained: Number(item.marks_obtained || 0),
                            total_marks: Number(item.max_marks || item.total_marks || 100)
                        }];
                    }
                }

                if (marksList.length === 0) {
                    errors.push({ row: i + 1, message: `No valid subject marks found for student ${student.student_name}` });
                    continue;
                }

                let existing = await ExamMark.findOne({ exam_id, class_id, student_id: student._id });
                if (!existing) {
                    existing = new ExamMark({
                        exam_id,
                        class_id,
                        student_id: student._id,
                        school_id,
                        marks: []
                    });
                }

                // Merge or update marks for specified subjects
                marksList.forEach(nm => {
                    const idx = existing.marks.findIndex(m => m.subject_id.toString() === nm.subject_id.toString());
                    if (idx >= 0) {
                        existing.marks[idx].marks_obtained = nm.marks_obtained;
                        existing.marks[idx].total_marks = nm.total_marks;
                    } else {
                        existing.marks.push(nm);
                    }
                });

                await existing.save();
                createdMarks.push(existing);
            } catch (rowErr) {
                errors.push({ row: i + 1, message: rowErr.message });
            }
        }

        res.json({
            success: true,
            count: createdMarks.length,
            createdMarks,
            errors,
            message: `Successfully imported exam marks for ${createdMarks.length} students`
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
    bulkImportExamMarks,
    getExamReport
};
