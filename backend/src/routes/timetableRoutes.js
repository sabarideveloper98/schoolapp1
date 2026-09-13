const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/authMiddleware');
const {
    getAllTimetables,
    getClassTimetableBySection,
    getTeacherTimetableByTeacherId,
    createTimetable,
    updateTimetable,
    deleteTimetable,
    getPrintTimetable,
    getDashboardStats,
    getSettings,
    saveSettings,
    getClasses,
    getClassTimetable,
    saveClassTimetable,
    getTeacherTimetable,
    getGlobalTimetable,
    checkConflicts,
    autoGenerate,
    getAssignments,
    saveAssignment,
    deleteAssignment,
    getTeacherAvailability,
    saveTeacherAvailability,
    getStudentTimetable
} = require('../controllers/timetableController');

// Protect all routes
router.use(protect);

// Standard API endpoints requested by specification
router.get('/', authorize('SchoolAdmin', 'SuperAdmin'), getAllTimetables);
router.get('/class/:classId/:sectionId', getClassTimetableBySection);
router.get('/teacher/:teacherId', getTeacherTimetableByTeacherId);
router.post('/create', authorize('SchoolAdmin', 'SuperAdmin'), createTimetable);
router.put('/update/:id', authorize('SchoolAdmin', 'SuperAdmin'), updateTimetable);
router.delete('/delete/:id', authorize('SchoolAdmin', 'SuperAdmin'), deleteTimetable);
router.post('/auto-generate', authorize('SchoolAdmin', 'SuperAdmin'), autoGenerate);
router.get('/print', authorize('SchoolAdmin', 'SuperAdmin', 'Teacher'), getPrintTimetable);

// Module Sub-routes
router.get('/dashboard', authorize('SchoolAdmin', 'SuperAdmin'), getDashboardStats);
router.get('/settings', authorize('SchoolAdmin', 'SuperAdmin'), getSettings);
router.post('/settings', authorize('SchoolAdmin', 'SuperAdmin'), saveSettings);
router.get('/classes', authorize('SchoolAdmin', 'SuperAdmin', 'Teacher'), getClasses);
router.get('/class/:id', getClassTimetable);
router.post('/save', authorize('SchoolAdmin', 'SuperAdmin'), saveClassTimetable);
router.post('/publish', authorize('SchoolAdmin', 'SuperAdmin'), saveClassTimetable);
router.get('/global', authorize('SchoolAdmin', 'SuperAdmin'), getGlobalTimetable);
router.post('/conflicts', authorize('SchoolAdmin', 'SuperAdmin'), checkConflicts);
router.post('/generate', authorize('SchoolAdmin', 'SuperAdmin'), autoGenerate);
router.get('/assignments', authorize('SchoolAdmin', 'SuperAdmin'), getAssignments);
router.post('/assignments', authorize('SchoolAdmin', 'SuperAdmin'), saveAssignment);
router.delete('/assignments/:id', authorize('SchoolAdmin', 'SuperAdmin'), deleteAssignment);
router.get('/availability', authorize('SchoolAdmin', 'SuperAdmin', 'Teacher'), getTeacherAvailability);
router.post('/availability', authorize('SchoolAdmin', 'SuperAdmin', 'Teacher'), saveTeacherAvailability);
router.get('/student', authorize('Student', 'Parent', 'SchoolAdmin', 'SuperAdmin'), getStudentTimetable);

module.exports = router;
