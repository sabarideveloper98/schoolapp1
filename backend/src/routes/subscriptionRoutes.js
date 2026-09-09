const express = require('express');
const router = express.Router();
const {
    getSubscriptionConfig,
    updateSubscriptionConfig,
    getAllSubscriptions,
    getCurrentSchoolSubscription,
    createSubscriptionOrder,
    verifyAndActivateSubscription
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Public or Authenticated Config Fetch
router.get('/config', getSubscriptionConfig);

// Super Admin Routes
router.put('/superadmin/config', protect, authorize('SuperAdmin'), updateSubscriptionConfig);
router.get('/superadmin/subscriptions', protect, authorize('SuperAdmin'), getAllSubscriptions);

// School Admin Routes
router.get('/schooladmin/current', protect, authorize('SchoolAdmin'), getCurrentSchoolSubscription);
router.post('/schooladmin/create-order', protect, authorize('SchoolAdmin'), createSubscriptionOrder);
router.post('/schooladmin/verify-payment', protect, authorize('SchoolAdmin'), verifyAndActivateSubscription);

module.exports = router;
