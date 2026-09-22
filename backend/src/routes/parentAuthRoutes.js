const express = require('express');
const router = express.Router();
const {
    loginParent,
    logoutParent,
    refreshTokenParent,
    forgotPasswordParent,
    resetPasswordParent,
    changePasswordParent,
    getParentAuthProfile
} = require('../controllers/parentAuthController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { logParentActivity } = require('../middlewares/auditMiddleware');

// Public Auth Routes
router.post('/login', logParentActivity('Parent Login Attempt'), loginParent);
router.post('/logout', logoutParent);
router.post('/refresh-token', refreshTokenParent);
router.post('/forgot-password', forgotPasswordParent);
router.post('/reset-password', resetPasswordParent);

// Protected Auth Routes
router.use(protect);
router.use(authorize('Parent'));

router.post('/change-password', logParentActivity('Parent Change Password'), changePasswordParent);
router.get('/profile', logParentActivity('Parent Auth Profile Fetch'), getParentAuthProfile);

module.exports = router;
