const express = require('express');
const router = express.Router();
const {
    loginTeacher,
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
    getSentMessages,
    getTeacherTimetableEndpoint,
    getTeacherDailyTimetable,
    getTeacherWeeklyTimetable,
    getTeacherTimetableByDate,
    getTeacherTimetableByDay,
    getTeacherClassTimetable,
    getTeacherSectionTimetable,
    getTeacherAssignedSubjects,
    getTeacherPeriodDetails,
    getTeacherScheduleEndpoint,
    getTeacherUpcomingClasses
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public auth route
router.post('/auth/login', loginTeacher);

// All other routes require Teacher role
router.use(protect);
router.use(authorize('Teacher'));

router.get('/dashboard-stats', getDashboardStats);

router.route('/profile')
    .get(getProfile)
    .put(updateProfile);

router.put('/change-password', changePassword);

router.route('/students')
    .get(getStudents)
    .post(createStudent);

router.route('/students/:id')
    .get(getStudentDetails)
    .put(updateStudentDetails);

router.get('/classes', getClasses);

router.post('/attendance', markAttendance);
router.get('/attendance/report', getAttendanceReport);

const { bulkImportExamMarks } = require('../controllers/examController');

router.get('/exams', getExams);
router.post('/marks', saveExamMarks);
router.post('/marks/bulk-import', bulkImportExamMarks);
router.get('/marks/report', getMarksReport);

router.route('/materials')
    .get(getStudyMaterials)
    .post(uploadStudyMaterial);
router.delete('/materials/:id', deleteStudyMaterial);

router.route('/leaves')
    .get(getLeaves)
    .post(applyLeave);
router.put('/leaves/:id/cancel', cancelLeave);

router.route('/remarks')
    .get(getRemarks)
    .post(addRemark);
router.delete('/remarks/:id', deleteRemark);

router.get('/queries', getQueries);
router.post('/queries/:id/reply', replyQuery);

router.route('/notices')
    .get(getNotices)
    .post(sendNotice);

router.get('/transport', getTransportDetails);
router.get('/announcements', getAnnouncements);
router.get('/reports', getTeacherReports);
router.get('/notifications', getNotifications);

router.route('/messages')
    .get(getSentMessages)
    .post(sendMessage);

// Timetable Module Routes
router.get('/timetable', getTeacherTimetableEndpoint);
router.get('/timetable/daily', getTeacherDailyTimetable);
router.get('/timetable/weekly', getTeacherWeeklyTimetable);
router.get('/timetable/date/:date', getTeacherTimetableByDate);
router.get('/timetable/day/:day', getTeacherTimetableByDay);
router.get('/timetable/class/:classId', getTeacherClassTimetable);
router.get('/timetable/class/:classId/section/:sectionId', getTeacherSectionTimetable);
router.get('/timetable/subjects', getTeacherAssignedSubjects);
router.get('/timetable/periods', getTeacherPeriodDetails);
router.get('/timetable/period-timings', getTeacherPeriodDetails);
router.get('/timetable/schedule', getTeacherScheduleEndpoint);
router.get('/timetable/upcoming', getTeacherUpcomingClasses);

// Homework & Assignments Module Routes
const homeworkRoutes = require('./homeworkRoutes');
router.use('/homework', homeworkRoutes);
router.use('/assignments', homeworkRoutes);

module.exports = router;

