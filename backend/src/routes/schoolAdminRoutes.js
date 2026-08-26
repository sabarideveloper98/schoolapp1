const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getTeachers, createTeacher, deleteTeacher, updateTeacher,
    getStaff, createStaff, deleteStaff, updateStaff,
    getSubjects, createSubject, deleteSubject, updateSubject,
    getClasses, createClass, deleteClass, updateClass,
    getClassSubjects, assignSubjectTeacher, removeSubjectTeacher, updateSubjectTeacher,
    getStudents, createStudent, updateStudent, deleteStudent
} = require('../controllers/schoolAdminController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { 
    getStaffAttendance, saveStaffAttendance, getStaffAttendanceReport,
    getStudentAttendance, saveStudentAttendance, getStudentAttendanceReport
} = require('../controllers/attendanceController');
const {
    getExams, createExam, getExamStudentsMarks, saveExamMarks, getExamReport
} = require('../controllers/examController');

// All routes require SchoolAdmin role
router.use(protect);
router.use(authorize('SchoolAdmin'));

router.get('/dashboard', getDashboardStats);

router.route('/teachers').get(getTeachers).post(createTeacher);
router.route('/teachers/:id').put(updateTeacher).delete(deleteTeacher);

router.route('/staff').get(getStaff).post(createStaff);
router.route('/staff/:id').put(updateStaff).delete(deleteStaff);

router.route('/subjects').get(getSubjects).post(createSubject);
router.route('/subjects/:id').put(updateSubject).delete(deleteSubject);

router.route('/classes').get(getClasses).post(createClass);
router.route('/classes/:id').put(updateClass).delete(deleteClass);

router.route('/assignments').get(getClassSubjects).post(assignSubjectTeacher);
router.route('/assignments/:id').put(updateSubjectTeacher).delete(removeSubjectTeacher);

router.route('/students').get(getStudents).post(createStudent);
router.route('/students/:id').put(updateStudent).delete(deleteStudent);

router.route('/attendance').get(getStaffAttendance).post(saveStaffAttendance);
router.route('/attendance/report').get(getStaffAttendanceReport);
router.route('/student-attendance').get(getStudentAttendance).post(saveStudentAttendance);
router.route('/student-attendance/report').get(getStudentAttendanceReport);

router.route('/exams').get(getExams).post(createExam);
router.route('/exam-marks').get(getExamStudentsMarks).post(saveExamMarks);
router.route('/exam-report').get(getExamReport);

module.exports = router;
