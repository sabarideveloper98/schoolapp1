const express = require('express');
const router = express.Router();
const {
    driverLogin,
    sendDriverOtp,
    verifyDriverOtp,
    getDriverProfile,
    updateDriverProfile,
    changePasswordParent,
    changeDriverPassword,
    getDriverPortalData,
    getDriverRouteDetails,
    getDriverAssignedStudents,
    startTrip,
    updateGpsLocation,
    markStudentBoarding,
    getStudentBoardingLogs,
    triggerEmergency,
    reportDelay,
    endTrip,
    getDriverNotifications,
    getDriverTripHistory
} = require('../controllers/driverStaffController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public OTP Auth Routes
router.post('/send-otp', sendDriverOtp);
router.post('/verify-otp', verifyDriverOtp);
router.post('/auth/send-otp', sendDriverOtp);
router.post('/auth/verify-otp', verifyDriverOtp);
router.post('/auth/login', driverLogin);

// All operational routes require JWT Authentication with 'Driver' role
router.use(protect);
router.use(authorize('Driver'));

// Profile Management
router.get('/profile', getDriverProfile);
router.put('/profile', updateDriverProfile);
router.put('/change-password', changeDriverPassword);

// Driver Portal Dashboard & Route Details
router.get('/portal', getDriverPortalData);
router.get('/route', getDriverRouteDetails);
router.get('/students', getDriverAssignedStudents);

// Trip Operations & Live Location Streaming
router.post('/trip/start', startTrip);
router.post('/gps/update', updateGpsLocation);
router.post('/student/boarding', markStudentBoarding);
router.get('/student/boarding-logs', getStudentBoardingLogs);

// Emergency Alerts & Delay Reports
router.post('/emergency/alert', triggerEmergency);
router.post('/trip/delay', reportDelay);

// End Trip & History
router.post('/trip/end', endTrip);
router.get('/notifications', getDriverNotifications);
router.get('/trip-history', getDriverTripHistory);

module.exports = router;
