const express = require('express');
const router = express.Router();
const {
    getSchools,
    createSchool,
    getSchoolById,
    updateSchool,
    deleteSchool,
    getDashboardStats
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// All routes require SuperAdmin role
router.use(protect);
router.use(authorize('SuperAdmin'));

router.route('/dashboard').get(getDashboardStats);
router.route('/schools')
    .get(getSchools)
    .post(createSchool);

router.route('/schools/:id')
    .get(getSchoolById)
    .put(updateSchool)
    .delete(deleteSchool);

module.exports = router;
