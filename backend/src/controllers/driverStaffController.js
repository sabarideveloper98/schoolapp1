const Driver = require('../models/Driver');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const RouteStop = require('../models/RouteStop');
const StudentTransport = require('../models/StudentTransport');
const TripHistory = require('../models/TripHistory');
const TransportNotification = require('../models/TransportNotification');
const StudentBoardingLog = require('../models/StudentBoardingLog');
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to calculate distance between 2 coordinates in KM
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

// @desc    Driver Staff Login
// @route   POST /api/driver/auth/login
// @access  Public
const driverLogin = async (req, res) => {
    try {
        const { mobile_number, password } = req.body;
        if (!mobile_number || !password) {
            return res.status(400).json({ message: 'Mobile number and password are required' });
        }

        const driver = await Driver.findOne({ mobile_number: mobile_number.trim() }).populate('assigned_bus_id');
        if (!driver) {
            return res.status(401).json({ message: 'Invalid mobile number or password' });
        }

        const isMatch = await driver.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid mobile number or password' });
        }

        if (driver.status !== 'Active') {
            return res.status(403).json({ message: 'Driver account is inactive. Please contact School Administration.' });
        }

        const token = jwt.sign(
            { id: driver._id, role: 'Driver', school_id: driver.school_id },
            process.env.JWT_SECRET || 'supersecretjwtkey12345',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            driver: {
                _id: driver._id,
                driver_id: driver.driver_id,
                name: driver.name,
                mobile_number: driver.mobile_number,
                email: driver.email || '',
                license_number: driver.license_number,
                school_id: driver.school_id,
                assigned_bus: driver.assigned_bus_id
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Driver login failed', error: error.message });
    }
};

// @desc    Get Authenticated Driver Profile
// @route   GET /api/driver/profile
// @access  Private (Driver)
const getDriverProfile = async (req, res) => {
    try {
        const driver = await Driver.findById(req.user.id || req.user._id)
            .populate('assigned_bus_id')
            .populate('school_id', 'name code location email');

        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

        res.json(driver);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch driver profile', error: error.message });
    }
};

// @desc    Update Driver Profile Details
// @route   PUT /api/driver/profile
// @access  Private (Driver)
const updateDriverProfile = async (req, res) => {
    try {
        const { email, address, photo, mobile_number } = req.body;
        const driver = await Driver.findById(req.user.id || req.user._id);

        if (!driver) return res.status(404).json({ message: 'Driver profile not found' });

        if (email !== undefined) driver.email = email;
        if (address !== undefined) driver.address = address;
        if (photo !== undefined) driver.photo = photo;
        if (mobile_number !== undefined) driver.mobile_number = mobile_number;

        await driver.save();
        res.json({ message: 'Driver profile updated successfully', driver });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update profile', error: error.message });
    }
};

// @desc    Change Driver Password
// @route   PUT /api/driver/change-password
// @access  Private (Driver)
const changeDriverPassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        if (!old_password || !new_password) {
            return res.status(400).json({ message: 'Old and new passwords are required' });
        }

        const driver = await Driver.findById(req.user.id || req.user._id);
        const isMatch = await driver.matchPassword(old_password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        driver.password = new_password; // Model pre-save hashes it
        await driver.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};

// @desc    Get Driver Dashboard / Portal Data
// @route   GET /api/driver/portal-data
// @access  Private (Driver)
const getDriverPortalData = async (req, res) => {
    try {
        const driverId = req.user.id || req.user._id;
        const driver = await Driver.findById(driverId).populate('assigned_bus_id');
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        let assignedRoute = null;
        let routeStops = [];
        let assignedStudents = [];

        if (driver.assigned_bus_id) {
            assignedRoute = await Route.findOne({ assigned_bus_id: driver.assigned_bus_id._id, status: 'Active' });
            if (assignedRoute) {
                routeStops = await RouteStop.find({ route_id: assignedRoute._id }).sort({ stop_order: 1 });
                assignedStudents = await StudentTransport.find({ route_id: assignedRoute._id, status: 'Active' })
                    .populate('student_id', 'student_name roll_no parent_name parent_phone photo class_id')
                    .populate('pickup_stop_id', 'stop_name estimated_arrival_time');
            }
        }

        const activeTrip = await TripHistory.findOne({
            driver_id: driver._id,
            status: { $in: ['In Progress', 'Emergency'] }
        }).populate('route_id');

        res.json({
            driver,
            assignedBus: driver.assigned_bus_id,
            assignedRoute,
            totalStopsCount: routeStops.length,
            totalStudentsCount: assignedStudents.length,
            routeStops,
            assignedStudents,
            activeTrip
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch portal data', error: error.message });
    }
};

// @desc    Get Assigned Route Details
// @route   GET /api/driver/route-details
// @access  Private (Driver)
const getDriverRouteDetails = async (req, res) => {
    try {
        const driverId = req.user.id || req.user._id;
        const driver = await Driver.findById(driverId);
        if (!driver || !driver.assigned_bus_id) {
            return res.status(404).json({ message: 'No bus assigned to this driver' });
        }

        const route = await Route.findOne({ assigned_bus_id: driver.assigned_bus_id, status: 'Active' })
            .populate('assigned_bus_id');

        if (!route) {
            return res.status(404).json({ message: 'No active route linked to your assigned bus' });
        }

        const stops = await RouteStop.find({ route_id: route._id }).sort({ stop_order: 1 });

        res.json({
            route,
            stops
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch route details', error: error.message });
    }
};

// @desc    Get Assigned Students List
// @route   GET /api/driver/assigned-students
// @access  Private (Driver)
const getDriverAssignedStudents = async (req, res) => {
    try {
        const driverId = req.user.id || req.user._id;
        const driver = await Driver.findById(driverId);
        if (!driver || !driver.assigned_bus_id) {
            return res.status(404).json({ message: 'No bus assigned to this driver' });
        }

        const route = await Route.findOne({ assigned_bus_id: driver.assigned_bus_id, status: 'Active' });
        if (!route) {
            return res.status(404).json({ message: 'No active route found' });
        }

        const allocations = await StudentTransport.find({ route_id: route._id, status: 'Active' })
            .populate('student_id', 'student_name roll_no admission_number parent_name parent_phone address photo')
            .populate('class_id', 'class section')
            .populate('pickup_stop_id', 'stop_name estimated_arrival_time')
            .populate('drop_stop_id', 'stop_name');

        res.json(allocations);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch assigned students', error: error.message });
    }
};

// @desc    Start Bus Trip
// @route   POST /api/driver/start-trip
// @access  Private (Driver)
const startTrip = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;
        const driver = await Driver.findById(driver_id).populate('assigned_bus_id');
        if (!driver || !driver.assigned_bus_id) {
            return res.status(400).json({ message: 'No assigned bus found for this driver' });
        }

        const route = await Route.findOne({ assigned_bus_id: driver.assigned_bus_id._id, status: 'Active' });
        if (!route) {
            return res.status(400).json({ message: 'No active route linked to this bus' });
        }

        let activeTrip = await TripHistory.findOne({
            driver_id: driver._id,
            status: 'In Progress'
        });

        if (activeTrip) {
            return res.json({ message: 'Trip already in progress', trip: activeTrip });
        }

        const stops = await RouteStop.find({ route_id: route._id }).sort({ stop_order: 1 });
        const firstStop = stops[0]?.stop_name || route.start_point;
        const nextStop = stops[1]?.stop_name || route.end_point;

        const trip_id = `TRIP-${Date.now()}`;
        activeTrip = await TripHistory.create({
            school_id: driver.school_id,
            trip_id,
            driver_id: driver._id,
            bus_id: driver.assigned_bus_id._id,
            route_id: route._id,
            start_time: new Date(),
            status: 'In Progress',
            current_stop: firstStop,
            next_stop: nextStop,
            previous_stop: 'Start Depot',
            arrival_status: 'On Time'
        });

        await TransportNotification.create({
            school_id: driver.school_id,
            bus_id: driver.assigned_bus_id._id,
            trip_id,
            title: 'Bus Trip Started',
            message: `Bus ${driver.assigned_bus_id.bus_number} (${route.route_name}) has started its journey.`,
            type: 'TripStarted',
            recipient_role: 'All'
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('trip_started', {
                trip_id,
                bus_id: driver.assigned_bus_id._id,
                bus_number: driver.assigned_bus_id.bus_number,
                route_name: route.route_name
            });
        }

        res.json({ message: 'Trip started successfully', trip: activeTrip });
    } catch (error) {
        res.status(500).json({ message: 'Failed to start trip', error: error.message });
    }
};

// @desc    Update GPS Location Stream
// @route   POST /api/driver/update-location
// @access  Private (Driver)
const updateGpsLocation = async (req, res) => {
    try {
        const { latitude, longitude, speed } = req.body;
        const driver_id = req.user.id || req.user._id;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const activeTrip = await TripHistory.findOne({
            driver_id,
            status: { $in: ['In Progress', 'Emergency'] }
        });

        if (!activeTrip) {
            return res.status(404).json({ message: 'No active trip found for this driver' });
        }

        const stops = await RouteStop.find({ route_id: activeTrip.route_id }).sort({ stop_order: 1 });
        let closestStop = null;
        let minDistance = Infinity;
        let closestStopIndex = 0;

        stops.forEach((stop, idx) => {
            const dist = calculateDistanceKm(latitude, longitude, stop.latitude, stop.longitude);
            if (dist < minDistance) {
                minDistance = dist;
                closestStop = stop;
                closestStopIndex = idx;
            }
        });

        if (closestStop) {
            activeTrip.current_stop = closestStop.stop_name;
            activeTrip.previous_stop = closestStopIndex > 0 ? stops[closestStopIndex - 1].stop_name : 'Start Point';
            activeTrip.next_stop = closestStopIndex < stops.length - 1 ? stops[closestStopIndex + 1].stop_name : 'School Gate';

            const currentSpeedKmh = speed && speed > 0 ? (speed * 3.6) : 30;
            const etaMins = Math.max(1, Math.round((minDistance / Math.max(currentSpeedKmh, 10)) * 60));
            activeTrip.eta_minutes = etaMins;

            if (minDistance <= 0.3) {
                activeTrip.arrival_status = 'Arriving Soon';
            } else {
                activeTrip.arrival_status = 'On Time';
            }
        }

        activeTrip.current_latitude = parseFloat(latitude);
        activeTrip.current_longitude = parseFloat(longitude);
        activeTrip.current_speed = speed ? Math.round(speed) : 0;

        activeTrip.gps_logs.push({
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            speed: speed ? Math.round(speed) : 0,
            timestamp: new Date()
        });

        await activeTrip.save();

        const locationPayload = {
            trip_id: activeTrip.trip_id,
            bus_id: activeTrip.bus_id,
            driver_id: activeTrip.driver_id,
            latitude: activeTrip.current_latitude,
            longitude: activeTrip.current_longitude,
            speed: activeTrip.current_speed,
            previous_stop: activeTrip.previous_stop,
            current_stop: activeTrip.current_stop,
            next_stop: activeTrip.next_stop,
            eta_minutes: activeTrip.eta_minutes,
            arrival_status: activeTrip.arrival_status,
            timestamp: new Date()
        };

        if (req.app.get('io')) {
            req.app.get('io').emit('bus_location_update', locationPayload);
        }

        res.json({ message: 'GPS location updated successfully', locationPayload });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update location', error: error.message });
    }
};

// @desc    Mark Student Boarding / Deboarding Status
// @route   POST /api/driver/student-boarding
// @access  Private (Driver)
const markStudentBoarding = async (req, res) => {
    try {
        const { student_id, action_type, stop_name, notes } = req.body;
        const driver_id = req.user.id || req.user._id;

        if (!student_id || !action_type) {
            return res.status(400).json({ message: 'Student ID and action type (Boarded/Dropped/Absent) are required' });
        }

        const activeTrip = await TripHistory.findOne({ driver_id, status: { $in: ['In Progress', 'Emergency'] } });
        if (!activeTrip) {
            return res.status(404).json({ message: 'No active trip in progress' });
        }

        const boardingLog = await StudentBoardingLog.create({
            school_id: activeTrip.school_id,
            trip_id: activeTrip.trip_id,
            bus_id: activeTrip.bus_id,
            driver_id,
            student_id,
            stop_name: stop_name || activeTrip.current_stop,
            action_type,
            notes: notes || ''
        });

        // Trigger Socket.IO notification to parent
        const student = await Student.findById(student_id);
        if (req.app.get('io')) {
            req.app.get('io').emit('student_boarding_event', {
                student_id,
                student_name: student?.student_name,
                action_type,
                stop_name: boardingLog.stop_name,
                time: new Date()
            });
        }

        res.status(201).json({ message: `Student marked as ${action_type}`, boardingLog });
    } catch (error) {
        res.status(500).json({ message: 'Failed to record student boarding', error: error.message });
    }
};

// @desc    Get Student Boarding Logs for Trip
// @route   GET /api/driver/student-boarding-logs/:tripId
// @access  Private (Driver)
const getStudentBoardingLogs = async (req, res) => {
    try {
        const { tripId } = req.params;
        const logs = await StudentBoardingLog.find({ trip_id: tripId })
            .populate('student_id', 'student_name roll_no admission_number photo parent_phone')
            .sort({ timestamp: -1 });

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch boarding logs', error: error.message });
    }
};

// @desc    Trigger Emergency SOS Alert
// @route   POST /api/driver/emergency
// @access  Private (Driver)
const triggerEmergency = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;
        const { reason } = req.body;

        const activeTrip = await TripHistory.findOne({ driver_id, status: { $in: ['In Progress', 'Emergency'] } })
            .populate('bus_id')
            .populate('driver_id');

        if (activeTrip) {
            activeTrip.status = 'Emergency';
            await activeTrip.save();
        }

        const notification = await TransportNotification.create({
            school_id: req.user.school_id,
            bus_id: activeTrip ? activeTrip.bus_id._id : null,
            trip_id: activeTrip ? activeTrip.trip_id : '',
            title: '⚠️ EMERGENCY SOS ALERT!',
            message: `EMERGENCY ALERT: Driver ${activeTrip?.driver_id?.name || 'Driver'} reported: "${reason || 'Emergency Situation'}". Immediate assistance needed!`,
            type: 'Emergency',
            recipient_role: 'All'
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('emergency_alert', notification);
        }

        res.json({ message: 'Emergency SOS alert triggered successfully', notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to trigger emergency alert', error: error.message });
    }
};

// @desc    Report Route Delay
// @route   POST /api/driver/report-delay
// @access  Private (Driver)
const reportDelay = async (req, res) => {
    try {
        const { delay_minutes, reason } = req.body;
        const driver_id = req.user.id || req.user._id;

        const activeTrip = await TripHistory.findOne({
            driver_id,
            status: { $in: ['In Progress', 'Emergency'] }
        }).populate('bus_id');

        if (!activeTrip) {
            return res.status(404).json({ message: 'No active trip in progress' });
        }

        activeTrip.arrival_status = 'Delayed';
        activeTrip.eta_minutes = (activeTrip.eta_minutes || 0) + parseInt(delay_minutes || 10);
        await activeTrip.save();

        const busNumber = activeTrip.bus_id?.bus_number || 'assigned bus';
        const busId = activeTrip.bus_id?._id || activeTrip.bus_id;

        const notification = await TransportNotification.create({
            school_id: activeTrip.school_id,
            bus_id: busId,
            trip_id: activeTrip.trip_id,
            title: 'Bus Delay Alert',
            message: `Bus ${busNumber} is delayed by approx ${delay_minutes || 10} mins. Reason: ${reason || 'Traffic Jam'}.`,
            type: 'Delayed',
            recipient_role: 'All'
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('bus_delay_alert', notification);
        }

        res.json({ message: 'Delay reported successfully', trip: activeTrip, notification });
    } catch (error) {
        res.status(500).json({ message: 'Failed to report delay', error: error.message });
    }
};

// @desc    End Bus Trip
// @route   POST /api/driver/end-trip
// @access  Private (Driver)
const endTrip = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;

        const activeTrip = await TripHistory.findOne({
            driver_id,
            status: { $in: ['In Progress', 'Emergency'] }
        });

        if (!activeTrip) {
            return res.status(404).json({ message: 'No active trip in progress' });
        }

        activeTrip.status = 'Completed';
        activeTrip.end_time = new Date();

        if (activeTrip.gps_logs.length >= 2) {
            let totalDist = 0;
            for (let i = 1; i < activeTrip.gps_logs.length; i++) {
                totalDist += calculateDistanceKm(
                    activeTrip.gps_logs[i - 1].latitude,
                    activeTrip.gps_logs[i - 1].longitude,
                    activeTrip.gps_logs[i].latitude,
                    activeTrip.gps_logs[i].longitude
                );
            }
            activeTrip.distance_travelled_km = parseFloat(totalDist.toFixed(2));
        }

        await activeTrip.save();

        await TransportNotification.create({
            school_id: activeTrip.school_id,
            bus_id: activeTrip.bus_id,
            trip_id: activeTrip.trip_id,
            title: 'Bus Trip Completed',
            message: `Trip ${activeTrip.trip_id} completed safely. Total distance: ${activeTrip.distance_travelled_km} km.`,
            type: 'ReachedSchool',
            recipient_role: 'All'
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('trip_ended', { trip_id: activeTrip.trip_id });
        }

        res.json({ message: 'Trip completed safely', trip: activeTrip });
    } catch (error) {
        res.status(500).json({ message: 'Failed to end trip', error: error.message });
    }
};

// @desc    Get Driver Notifications
// @route   GET /api/driver/notifications
// @access  Private (Driver)
const getDriverNotifications = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;
        const driver = await Driver.findById(driver_id);

        const notifications = await TransportNotification.find({
            $or: [
                { bus_id: driver?.assigned_bus_id },
                { school_id: driver?.school_id }
            ]
        }).sort({ createdAt: -1 }).limit(30);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
    }
};

// @desc    Get Driver Trip History Logs
// @route   GET /api/driver/trip-history
// @access  Private (Driver)
const getDriverTripHistory = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;
        const trips = await TripHistory.find({ driver_id })
            .populate('bus_id', 'bus_number bus_name')
            .populate('route_id', 'route_name start_point end_point')
            .sort({ createdAt: -1 });

        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch trip history', error: error.message });
    }
};

module.exports = {
    driverLogin,
    getDriverProfile,
    updateDriverProfile,
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
};
