const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getTransportStats,
    getBuses,
    getBusById,
    createBus,
    updateBus,
    deleteBus,
    getDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver,
    driverLogin,
    getDriverPortalData,
    getRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,
    getStops,
    createStop,
    updateStop,
    deleteStop,
    assignDriverToBus,
    unassignDriver,
    assignRouteToBus,
    getStudentTransports,
    getStudentTransportById,
    assignStudentTransport,
    updateStudentTransport,
    removeStudentTransport,
    getRouteStudents,
    getVehicleStudents,
    getTransportFeeSummary,
    getStudentTransportFees,
    getTransportFeePaymentStatus,
    getPendingTransportFees,
    startTrip,
    updateGpsLocation,
    endTrip,
    triggerEmergency,
    forceStopTrip,
    getActiveTrips,
    getParentChildBusTracking,
    getTripHistoryLogs,
    getNotifications
} = require('../controllers/transportController');

// Driver Public Login
router.post('/driver/login', driverLogin);

// Protected Driver Portal APIs
router.get('/driver/portal-data', protect, getDriverPortalData);
router.post('/driver/start-trip', protect, startTrip);
router.post('/driver/update-location', protect, updateGpsLocation);
router.post('/driver/end-trip', protect, endTrip);
router.post('/driver/emergency', protect, triggerEmergency);

// Transport Dashboard & Stats
router.get('/stats', protect, getTransportStats);

// Transport Fee APIs (Mount before parameter routes)
router.get('/fees', protect, getTransportFeeSummary);
router.get('/fees/students', protect, getStudentTransportFees);
router.get('/fees/status', protect, getTransportFeePaymentStatus);
router.get('/fees/pending', protect, getPendingTransportFees);

// Buses & Vehicles CRUD
router.get('/buses', protect, getBuses);
router.get('/buses/:id', protect, getBusById);
router.post('/buses', protect, createBus);
router.put('/buses/:id', protect, updateBus);
router.delete('/buses/:id', protect, deleteBus);
router.get('/buses/:id/students', protect, getVehicleStudents);

router.get('/vehicles', protect, getBuses);
router.get('/vehicles/:id', protect, getBusById);
router.post('/vehicles', protect, createBus);
router.put('/vehicles/:id', protect, updateBus);
router.delete('/vehicles/:id', protect, deleteBus);
router.get('/vehicles/:id/students', protect, getVehicleStudents);

// Drivers CRUD
router.get('/drivers', protect, getDrivers);
router.get('/drivers/:id', protect, getDriverById);
router.post('/drivers', protect, createDriver);
router.put('/drivers/:id', protect, updateDriver);
router.delete('/drivers/:id', protect, deleteDriver);

// Routes & Stops CRUD
router.get('/routes', protect, getRoutes);
router.get('/routes/:id', protect, getRouteById);
router.post('/routes', protect, createRoute);
router.put('/routes/:id', protect, updateRoute);
router.delete('/routes/:id', protect, deleteRoute);
router.get('/routes/:id/students', protect, getRouteStudents);
router.get('/routes/:routeId/stops', protect, getStops);
router.post('/stops', protect, createStop);
router.put('/stops/:id', protect, updateStop);
router.delete('/stops/:id', protect, deleteStop);

// Assignments
router.post('/assign-driver', protect, assignDriverToBus);
router.post('/unassign-driver', protect, unassignDriver);
router.post('/assign-route', protect, assignRouteToBus);

// Student Allocations
router.get('/student-allocations', protect, getStudentTransports);
router.get('/student-allocations/:id', protect, getStudentTransportById);
router.post('/student-allocations', protect, assignStudentTransport);
router.put('/student-allocations/:id', protect, updateStudentTransport);
router.delete('/student-allocations/:id', protect, removeStudentTransport);

// Allocation Aliases
router.get('/allocations', protect, getStudentTransports);
router.get('/allocations/:id', protect, getStudentTransportById);
router.post('/allocations', protect, assignStudentTransport);
router.put('/allocations/:id', protect, updateStudentTransport);
router.delete('/allocations/:id', protect, removeStudentTransport);

// Live Tracking & History
router.get('/active-trips', protect, getActiveTrips);
router.post('/force-stop-trip/:tripId', protect, forceStopTrip);
router.get('/parent-tracking', protect, getParentChildBusTracking);
router.get('/trip-history', protect, getTripHistoryLogs);
router.get('/notifications', protect, getNotifications);

module.exports = router;
