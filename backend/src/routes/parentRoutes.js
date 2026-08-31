const express = require('express');
const router = express.Router();
const {
    getParentDashboard,
    getNotifications
} = require('../controllers/parentController');
const {
    getParentFees,
    createRazorpayOrder,
    verifyRazorpayPayment,
    requestRefund
} = require('../controllers/feeController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require Parent role
router.use(protect);
router.use(authorize('Parent'));

router.get('/dashboard', getParentDashboard);
router.get('/notifications', getNotifications);

// Parent Fee Management Routing
router.get('/fees', getParentFees);
router.post('/fees/pay-order', createRazorpayOrder);
router.post('/fees/pay-verify', verifyRazorpayPayment);
router.post('/fees/refund', requestRefund);

module.exports = router;
