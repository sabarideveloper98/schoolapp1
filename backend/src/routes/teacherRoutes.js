const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require Teacher role
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

router.get('/exams', getExams);
router.post('/marks', saveExamMarks);
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

module.exports = router;

