const express = require('express');
const router = express.Router();
const {
    getStudents,
    createStudent,
    getClasses,
    sendMessage,
    getSentMessages
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require Teacher role
router.use(protect);
router.use(authorize('Teacher'));

router.route('/students')
    .get(getStudents)
    .post(createStudent);

router.route('/classes')
    .get(getClasses);

router.route('/messages')
    .get(getSentMessages)
    .post(sendMessage);

module.exports = router;
