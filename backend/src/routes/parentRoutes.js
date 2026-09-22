const express = require('express');
const router = express.Router();
const parentAuthRoutes = require('./parentAuthRoutes');
const {
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
} = require('../controllers/parentModuleController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logParentActivity } = require('../middlewares/auditMiddleware');

// Auth Sub-routes (Login, Logout, Forgot, Reset, Change Password, Profile)
router.use('/auth', parentAuthRoutes);

// All operational routes below require JWT authentication with 'Parent' role
router.use(protect);
router.use(authorize('Parent'));
router.use(logParentActivity());

// Parent Profile
router.get('/profile', getParentProfile);

// Parent Dashboard
router.get('/dashboard', getParentDashboard);

// Child Management
router.get('/students', getLinkedStudents);
router.get('/students/:studentId', getStudentDetails);

// Attendance APIs
router.get('/attendance', getAttendance);
router.get('/attendance/:studentId', getAttendance);

// Homework APIs
router.get('/homework', getHomework);
router.get('/homework/:studentId', getHomework);

// Timetable APIs
router.get('/timetable', getTimetable);
router.get('/timetable/:studentId', getTimetable);

// Exam APIs
router.get('/exams', getExams);
router.get('/exams/:studentId', getExams);

// Marks & Report Card APIs
router.get('/results', getResults);
router.get('/results/:studentId', getResults);
router.get('/report-card/:studentId/:examId', getReportCard);

// Fee APIs (Read-only)
router.get('/fees', getFees);
router.get('/fees/:studentId', getFees);

// Announcement APIs
router.get('/announcements', getAnnouncements);
router.get('/announcements/:id', getAnnouncementById);

// Teacher Communication APIs
router.get('/messages', getConversations);
router.get('/messages/:conversationId', getConversationById);
router.post('/messages', startConversation);
router.post('/messages/:conversationId/reply', replyConversation);

// Leave Request APIs
router.post('/leave', submitLeaveRequest);
router.get('/leave', getLeaveRequests);
router.get('/leave/:id', getLeaveRequestById);

// Bus Tracking APIs
router.get('/transport', getTransportDetails);
router.get('/transport/live-location', getBusLiveLocation);

// Notification APIs
router.get('/notifications', getNotifications);
router.put('/notifications/read/:id', markNotificationRead);

module.exports = router;
