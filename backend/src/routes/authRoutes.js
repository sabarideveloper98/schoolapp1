const express = require('express');
const router = express.Router();
const {
    signupUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public Authentication Endpoints
router.post('/signup', signupUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh-token', refreshToken);

// Protected Authentication Endpoints
router.post('/logout', protect, logoutUser);
router.get('/me', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
