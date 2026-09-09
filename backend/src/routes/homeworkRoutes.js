const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
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
} = require('../controllers/homeworkController');

// Homework CRUD & Stats
router.get('/stats', protect, getHomeworkStats);
router.get('/list', protect, getHomeworkList);
router.get('/notifications', protect, getHomeworkNotifications);
router.post('/create', protect, createHomework);
router.get('/details/:id', protect, getHomeworkById);
router.put('/update/:id', protect, updateHomework);
router.delete('/delete/:id', protect, deleteHomework);

// Student Submissions & Feed
router.get('/student-feed', protect, getStudentHomework);
router.post('/submit', protect, submitHomework);

// Teacher Evaluations & Grading
router.post('/evaluate', protect, evaluateSubmission);

module.exports = router;
