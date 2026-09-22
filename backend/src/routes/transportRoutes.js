const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getTransportStats,
    getBuses,
    createBus,
    updateBus,
    deleteBus,
    getDrivers,
    createDriver,
    updateDriver,
    deleteDriver,
    driverLogin,
    getDriverPortalData,
    getRoutes,
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
    assignStudentTransport,
    removeStudentTransport,
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

// Buses CRUD
router.get('/buses', protect, getBuses);
router.post('/buses', protect, createBus);
router.put('/buses/:id', protect, updateBus);
router.delete('/buses/:id', protect, deleteBus);

// Drivers CRUD
router.get('/drivers', protect, getDrivers);
router.post('/drivers', protect, createDriver);
router.put('/drivers/:id', protect, updateDriver);
router.delete('/drivers/:id', protect, deleteDriver);

// Routes & Stops CRUD
router.get('/routes', protect, getRoutes);
router.post('/routes', protect, createRoute);
router.put('/routes/:id', protect, updateRoute);
router.delete('/routes/:id', protect, deleteRoute);
router.get('/routes/:routeId/stops', protect, getStops);
router.post('/stops', protect, createStop);
router.put('/stops/:id', protect, updateStop);
router.delete('/stops/:id', protect, deleteStop);

// Assignments
router.post('/assign-driver', protect, assignDriverToBus);
router.post('/unassign-driver', protect, unassignDriver);
router.post('/assign-route', protect, assignRouteToBus);
router.get('/student-allocations', protect, getStudentTransports);
router.post('/student-allocations', protect, assignStudentTransport);
router.delete('/student-allocations/:id', protect, removeStudentTransport);

// Live Tracking & History
router.get('/active-trips', protect, getActiveTrips);
router.post('/force-stop-trip/:tripId', protect, forceStopTrip);
router.get('/parent-tracking', protect, getParentChildBusTracking);
router.get('/trip-history', protect, getTripHistoryLogs);
router.get('/notifications', protect, getNotifications);

module.exports = router;
