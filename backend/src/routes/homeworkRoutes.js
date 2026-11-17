const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
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
    getHomeworkNotifications
} = require('../controllers/homeworkController');

// Homework Stats & Notifications
router.get('/stats', protect, getHomeworkStats);
router.get('/notifications', protect, getHomeworkNotifications);

// Homework Reports
router.get('/reports/summary', protect, getHomeworkSummaryReport);
router.get('/reports/student', protect, getStudentHomeworkReport);
router.get('/reports/class', protect, getClassHomeworkReport);
router.get('/reports/status', protect, getSubmissionStatusReport);

// Homework Submissions
router.get('/submissions', protect, getHomeworkSubmissions);
router.get('/submissions/pending', protect, getPendingSubmissions);
router.get('/submissions/completed', protect, getCompletedSubmissions);
router.get('/submissions/:id', protect, getSubmissionById);
router.get('/submissions/:id/attachments', protect, getSubmissionAttachments);

// Class, Section & Subject Filtered Endpoints
router.get('/class/:classId', protect, getClassHomework);
router.get('/class/:classId/section/:section', protect, getSectionHomework);
router.get('/subject/:subjectId', protect, getSubjectHomework);

// Student Feed & Actions
router.get('/student-feed', protect, getStudentHomework);
router.post('/submit', protect, submitHomework);
router.post('/evaluate', protect, evaluateSubmission);

// Homework CRUD (Legacy & RESTful Routes)
router.get('/list', protect, getHomeworkList);
router.post('/create', protect, createHomework);
router.get('/details/:id', protect, getHomeworkById);
router.put('/update/:id', protect, updateHomework);
router.delete('/delete/:id', protect, deleteHomework);

// Root RESTful Homework Routes
router.get('/', protect, getHomeworkList);
router.post('/', protect, createHomework);
router.get('/:id', protect, getHomeworkById);
router.put('/:id', protect, updateHomework);
router.delete('/:id', protect, deleteHomework);
router.get('/:id/submissions', protect, getHomeworkSubmissions);

module.exports = router;

