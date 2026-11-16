const express = require('express');
const router = express.Router();
const {
    getStudentAttendanceReport,
    loginStudent
} = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public Auth Endpoints
router.post('/login', loginStudent);
router.post('/auth/login', loginStudent);

// Protected Student Attendance Report Endpoints
router.get('/attendance/report', protect, authorize('Student'), getStudentAttendanceReport);
router.get('/attendance-report', protect, authorize('Student'), getStudentAttendanceReport);
router.get('/attendance', protect, authorize('Student'), getStudentAttendanceReport);

module.exports = router;
