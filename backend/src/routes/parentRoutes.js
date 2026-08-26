const express = require('express');
const router = express.Router();
const {
    getParentDashboard,
    getNotifications
} = require('../controllers/parentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require Parent role
router.use(protect);
router.use(authorize('Parent'));

router.get('/dashboard', getParentDashboard);
router.get('/notifications', getNotifications);

module.exports = router;
