const express = require('express');
const router = express.Router();
const {
    getSubscriptionConfig,
    getSubscriptionPlans,
    updateSubscriptionConfig,
    getAllSubscriptions,
    getSubscriptionById,
    getCurrentSchoolSubscription,
    getSchoolSubscriptionBySchoolId,
    createSubscriptionOrder,
    verifyAndActivateSubscription,
    submitBankTransferPayment,
    renewSubscription,
    cancelSubscription,
    getSubscriptionExpiryDetails,
    checkAndExpireSubscriptions,
    getSubscriptionStatus,
    getSubscriptionHistory,
    updateSubscriptionStatus,
    updateSubscriptionRecord
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// ==========================================
// 1. PUBLIC / GENERAL CONFIG & PLANS
// ==========================================
router.get('/config', getSubscriptionConfig);
router.get('/plans', getSubscriptionPlans);
router.get('/schooladmin/plans', getSubscriptionPlans);

// ==========================================
// 2. SUPER ADMIN ROUTES
// ==========================================
router.put('/superadmin/config', protect, authorize('SuperAdmin'), updateSubscriptionConfig);
router.get('/superadmin/subscriptions', protect, authorize('SuperAdmin'), getAllSubscriptions);
router.get('/superadmin/subscriptions/:id', protect, authorize('SuperAdmin'), getSubscriptionById);
router.put('/superadmin/subscriptions/:id/status', protect, authorize('SuperAdmin'), updateSubscriptionStatus);
router.patch('/superadmin/subscriptions/:id/status', protect, authorize('SuperAdmin'), updateSubscriptionStatus);
router.put('/superadmin/subscriptions/:id', protect, authorize('SuperAdmin'), updateSubscriptionRecord);
router.post('/check-expiry', protect, authorize('SuperAdmin'), checkAndExpireSubscriptions);

// School lookup by ID (SuperAdmin and SchoolAdmin)
router.get('/school/:schoolId', protect, authorize('SuperAdmin', 'SchoolAdmin'), getSchoolSubscriptionBySchoolId);

// ==========================================
// 3. SCHOOL ADMIN ROUTES
// ==========================================
router.get('/schooladmin/current', protect, authorize('SchoolAdmin'), getCurrentSchoolSubscription);
router.get('/schooladmin/status', protect, authorize('SchoolAdmin'), getSubscriptionStatus);
router.get('/schooladmin/expiry', protect, authorize('SchoolAdmin'), getSubscriptionExpiryDetails);
router.get('/schooladmin/history', protect, authorize('SchoolAdmin'), getSubscriptionHistory);

router.post('/schooladmin/create-order', protect, authorize('SchoolAdmin'), createSubscriptionOrder);
router.post('/schooladmin/verify-payment', protect, authorize('SchoolAdmin'), verifyAndActivateSubscription);
router.post('/schooladmin/bank-transfer', protect, authorize('SchoolAdmin'), submitBankTransferPayment);
router.post('/schooladmin/renew', protect, authorize('SchoolAdmin'), renewSubscription);
router.post('/schooladmin/cancel', protect, authorize('SchoolAdmin'), cancelSubscription);

// ==========================================
// 4. RESOURCE-LEVEL DIRECT ID ROUTES
// ==========================================
router.get('/:id', protect, getSubscriptionById);
router.put('/:id/cancel', protect, cancelSubscription);
router.put('/:id/status', protect, authorize('SuperAdmin'), updateSubscriptionStatus);
router.patch('/:id/status', protect, authorize('SuperAdmin'), updateSubscriptionStatus);
router.put('/:id', protect, authorize('SuperAdmin'), updateSubscriptionRecord);

module.exports = router;
