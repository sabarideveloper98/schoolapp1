const Bus = require('../models/Bus');
const Driver = require('../models/Driver');
const Route = require('../models/Route');
const RouteStop = require('../models/RouteStop');
const DriverAssignment = require('../models/DriverAssignment');
const StudentTransport = require('../models/StudentTransport');
const TripHistory = require('../models/TripHistory');
const TransportNotification = require('../models/TransportNotification');
const School = require('../models/School');
const Student = require('../models/Student');
const Staff = require('../models/Staff');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to resolve School ID from logged-in SchoolAdmin or User
const getSchoolId = async (user) => {
    if (user.school_id) return user.school_id;
    let school = await School.findOne({ admin_id: user._id });
    if (!school) {
        school = await School.findOne({});
    }
    return school ? school._id : user._id;
};

const getSchoolIds = async (user) => {
    const ids = [];
    if (user.school_id) ids.push(user.school_id);
    if (user._id) ids.push(user._id);
    const school = await School.findOne({ admin_id: user._id });
    if (school) {
        ids.push(school._id);
    }
    const allSchools = await School.find({});
    allSchools.forEach(s => {
        if (!ids.some(id => id.toString() === s._id.toString())) {
            ids.push(s._id);
        }
    });
    return ids;
};

// Helper to calculate distance between 2 coordinates in KM (Haversine formula)
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

// ----------------------------------------------------
// 1. Dashboard Stats
// ----------------------------------------------------
const getTransportStats = async (req, res) => {
    try {
        const schoolIds = await getSchoolIds(req.user);
        
        const totalBuses = await Bus.countDocuments({ school_id: { $in: schoolIds } });
        const activeRoutes = await Route.countDocuments({ school_id: { $in: schoolIds }, status: 'Active' });
        const totalDrivers = await Driver.countDocuments({ school_id: { $in: schoolIds }, status: 'Active' });
        const studentsUsingTransport = await StudentTransport.countDocuments({ school_id: { $in: schoolIds }, status: 'Active' });
        
        const activeTrips = await TripHistory.find({ school_id: { $in: schoolIds }, status: 'In Progress' })
            .populate('bus_id', 'bus_number bus_name vehicle_reg_number')
            .populate('driver_id', 'name mobile_number photo')
            .populate('route_id', 'route_name start_point end_point');

        const busesCurrentlyRunning = activeTrips.length;
        const delayedBuses = activeTrips.filter(t => t.arrival_status === 'Delayed').length;

        res.json({
            totalBuses,
            activeRoutes,
            totalDrivers,
            studentsUsingTransport,
            busesCurrentlyRunning,
            delayedBuses,
            activeTrips
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 2. Bus Management
// ----------------------------------------------------
const getBuses = async (req, res) => {
    try {
        const schoolIds = await getSchoolIds(req.user);
        const buses = await Bus.find({ school_id: { $in: schoolIds } }).sort({ createdAt: -1 });
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createBus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { bus_number, vehicle_reg_number, bus_name, bus_type, total_seats, gps_enabled, status } = req.body;

        if (!bus_number || !vehicle_reg_number || !bus_name || !total_seats) {
            return res.status(400).json({ message: 'Bus number, registration, name and total seats are required' });
        }

        const newBus = await Bus.create({
            school_id,
            bus_number,
            vehicle_reg_number,
            bus_name,
            bus_type: bus_type || 'Bus',
            total_seats: parseInt(total_seats),
            gps_enabled: gps_enabled !== undefined ? gps_enabled : true,
            status: status || 'Active'
        });

        res.status(201).json({ message: 'Bus created successfully', bus: newBus });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateBus = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        Object.assign(bus, req.body);
        await bus.save();

        res.json({ message: 'Bus updated successfully', bus });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteBus = async (req, res) => {
    try {
        const bus = await Bus.findByIdAndDelete(req.params.id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        res.json({ message: 'Bus deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 3. Driver Management & Authentication
// ----------------------------------------------------
const getDrivers = async (req, res) => {
    try {
        const schoolIds = await getSchoolIds(req.user);
        const school_id = await getSchoolId(req.user);

        // Sync Staff members with role 'Driver' into Driver collection if not present
        const driverStaffList = await Staff.find({ school_id: { $in: schoolIds }, role: { $regex: /^driver$/i } });
        for (const staff of driverStaffList) {
            const exists = await Driver.findOne({ mobile_number: staff.phone, school_id: { $in: schoolIds } });
            if (!exists) {
                await Driver.create({
                    school_id,
                    driver_id: `DRV-${Date.now()}`,
                    name: staff.name,
                    mobile_number: staff.phone,
                    email: staff.email,
                    address: staff.address || '',
                    license_number: `DL-${staff.phone}`,
                    password: `${staff.name.replace(/\s+/g, '')}@123`,
                    status: 'Active'
                });
            }
        }

        const drivers = await Driver.find({ school_id: { $in: schoolIds } }).populate('assigned_bus_id').sort({ createdAt: -1 });
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createDriver = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { driver_id, name, mobile_number, email, address, license_number, license_expiry, photo, password, status } = req.body;

        if (!driver_id || !name || !mobile_number || !license_number || !password) {
            return res.status(400).json({ message: 'Driver ID, Name, Mobile, License and Password are required' });
        }

        const existingDriver = await Driver.findOne({ mobile_number });
        if (existingDriver) {
            return res.status(400).json({ message: 'A driver with this mobile number already exists' });
        }

        const newDriver = await Driver.create({
            school_id,
            driver_id,
            name,
            mobile_number,
            email: email || '',
            address: address || '',
            license_number,
            license_expiry: license_expiry ? new Date(license_expiry) : null,
            photo: photo || '',
            password,
            status: status || 'Active'
        });

        // Sync with Staff model (role: 'Driver')
        const existingStaff = await Staff.findOne({ phone: mobile_number, school_id });
        if (!existingStaff) {
            const staffEmail = email || `driver_${mobile_number}@school.com`;
            let userAccount = await User.findOne({ email: staffEmail });
            if (!userAccount) {
                userAccount = await User.create({
                    email: staffEmail,
                    phone: mobile_number,
                    password: password,
                    role: 'Staff'
                });
            }
            const newStaff = await Staff.create({
                name,
                email: staffEmail,
                phone: mobile_number,
                role: 'Driver',
                address: address || 'N/A',
                qualification: 'Driving License',
                experience: 1,
                photo: photo || '',
                school_id,
                user_id: userAccount._id
            });
            userAccount.reference_id = newStaff._id;
            await userAccount.save();
        }

        res.status(201).json({ message: 'Driver registered successfully', driver: newDriver });
    } catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        if (req.body.password) {
            delete req.body.password; // Ignore plain password updates via general endpoint
        }

        Object.assign(driver, req.body);
        await driver.save();

        // Also update matching Staff record if exists
        const staff = await Staff.findOne({ phone: driver.mobile_number, school_id: driver.school_id });
        if (staff) {
            if (req.body.name) staff.name = req.body.name;
            if (req.body.mobile_number) staff.phone = req.body.mobile_number;
            if (req.body.address) staff.address = req.body.address;
            await staff.save();
        }

        res.json({ message: 'Driver updated successfully', driver });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteDriver = async (req, res) => {
    try {
        const driver = await Driver.findById(req.params.id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        const staff = await Staff.findOne({ phone: driver.mobile_number, school_id: driver.school_id });
        if (staff) {
            await User.findByIdAndDelete(staff.user_id);
            await Staff.findByIdAndDelete(staff._id);
        }

        await Driver.findByIdAndDelete(driver._id);

        res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const driverLogin = async (req, res) => {
    try {
        const { mobile_number, password } = req.body;
        if (!mobile_number || !password) {
            return res.status(400).json({ message: 'Mobile number and password are required' });
        }

        const driver = await Driver.findOne({ mobile_number }).populate('assigned_bus_id');
        if (!driver) {
            return res.status(401).json({ message: 'Invalid mobile number or password' });
        }

        const isMatch = await driver.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid mobile number or password' });
        }

        if (driver.status !== 'Active') {
            return res.status(403).json({ message: 'Driver account is inactive. Please contact School Admin.' });
        }

        const token = jwt.sign(
            { id: driver._id, role: 'Driver', school_id: driver.school_id },
            process.env.JWT_SECRET || 'supersecretjwtkey12345',
            { expiresIn: '30d' }
        );

        res.json({
            _id: driver._id,
            driver_id: driver.driver_id,
            name: driver.name,
            mobile_number: driver.mobile_number,
            school_id: driver.school_id,
            assigned_bus: driver.assigned_bus_id,
            token
        });
    } catch (error) {
        console.error('Error in driver login:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getDriverPortalData = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;
        const driver = await Driver.findById(driver_id).populate('assigned_bus_id');
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        let assignedRoute = null;
        let routeStops = [];
        let assignedStudents = [];

        if (driver.assigned_bus_id) {
            assignedRoute = await Route.findOne({ assigned_bus_id: driver.assigned_bus_id._id, status: 'Active' });
            if (assignedRoute) {
                routeStops = await RouteStop.find({ route_id: assignedRoute._id }).sort({ stop_order: 1 });
                assignedStudents = await StudentTransport.find({ route_id: assignedRoute._id, status: 'Active' })
                    .populate('student_id', 'student_name roll_no parent_name parent_phone photo')
                    .populate('pickup_stop_id', 'stop_name');
            }
        }

        const activeTrip = await TripHistory.findOne({
            driver_id: driver._id,
            status: 'In Progress'
        }).populate('route_id');

        res.json({
            driver,
            assignedBus: driver.assigned_bus_id,
            assignedRoute,
            routeStops,
            assignedStudents,
            activeTrip
        });
    } catch (error) {
        console.error('Error fetching driver portal data:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 4. Route & Stop Management
// ----------------------------------------------------
const getRoutes = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const routes = await Route.find({ school_id }).populate('assigned_bus_id').sort({ createdAt: -1 });

        const routesWithStops = await Promise.all(routes.map(async (r) => {
            const stops = await RouteStop.find({ route_id: r._id }).sort({ stop_order: 1 });
            return {
                ...r.toObject(),
                stops
            };
        }));

        res.json(routesWithStops);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createRoute = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { route_id, route_name, start_point, end_point, total_distance_km, estimated_duration_mins, assigned_bus_id, status } = req.body;

        if (!route_id || !route_name || !start_point || !end_point) {
            return res.status(400).json({ message: 'Route ID, Route Name, Start Point and End Point are required' });
        }

        const newRoute = await Route.create({
            school_id,
            route_id,
            route_name,
            start_point,
            end_point,
            total_distance_km: total_distance_km ? parseFloat(total_distance_km) : 0,
            estimated_duration_mins: estimated_duration_mins ? parseInt(estimated_duration_mins) : 0,
            assigned_bus_id: assigned_bus_id || null,
            status: status || 'Active'
        });

        res.status(201).json({ message: 'Route created successfully', route: newRoute });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        Object.assign(route, req.body);
        await route.save();

        res.json({ message: 'Route updated successfully', route });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteRoute = async (req, res) => {
    try {
        await RouteStop.deleteMany({ route_id: req.params.id });
        const route = await Route.findByIdAndDelete(req.params.id);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        res.json({ message: 'Route and associated stops deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getStops = async (req, res) => {
    try {
        const stops = await RouteStop.find({ route_id: req.params.routeId }).sort({ stop_order: 1 });
        res.json(stops);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const createStop = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { route_id, stop_name, stop_address, latitude, longitude, stop_order, estimated_arrival_time } = req.body;

        if (!route_id || !stop_name || latitude === undefined || longitude === undefined || stop_order === undefined) {
            return res.status(400).json({ message: 'Route ID, Stop Name, Latitude, Longitude and Stop Order are required' });
        }

        const newStop = await RouteStop.create({
            school_id,
            route_id,
            stop_name,
            stop_address: stop_address || '',
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            stop_order: parseInt(stop_order),
            estimated_arrival_time: estimated_arrival_time || ''
        });

        res.status(201).json({ message: 'Stop added successfully', stop: newStop });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateStop = async (req, res) => {
    try {
        const stop = await RouteStop.findById(req.params.id);
        if (!stop) return res.status(404).json({ message: 'Route Stop not found' });

        Object.assign(stop, req.body);
        await stop.save();

        res.json({ message: 'Route stop updated successfully', stop });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteStop = async (req, res) => {
    try {
        const stop = await RouteStop.findByIdAndDelete(req.params.id);
        if (!stop) return res.status(404).json({ message: 'Route stop not found' });

        res.json({ message: 'Route stop deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 5. Driver-Bus-Route Assignments & Student Allocation
// ----------------------------------------------------
const assignDriverToBus = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { driver_id, bus_id, route_id } = req.body;

        const driver = await Driver.findById(driver_id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        const bus = await Bus.findById(bus_id);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        driver.assigned_bus_id = bus._id;
        await driver.save();

        if (route_id) {
            const route = await Route.findById(route_id);
            if (route) {
                route.assigned_bus_id = bus._id;
                await route.save();
            }
        }

        const assignment = await DriverAssignment.create({
            school_id,
            driver_id,
            bus_id,
            route_id: route_id || null,
            status: 'Active'
        });

        res.json({ message: 'Driver assigned to Bus & Route successfully', assignment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const unassignDriver = async (req, res) => {
    try {
        const { driver_id } = req.body;
        const driver = await Driver.findById(driver_id);
        if (!driver) return res.status(404).json({ message: 'Driver not found' });

        driver.assigned_bus_id = null;
        await driver.save();

        await DriverAssignment.updateMany(
            { driver_id: driver._id, status: 'Active' },
            { status: 'Completed', unassigned_at: new Date() }
        );

        res.json({ message: 'Driver unassigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const assignRouteToBus = async (req, res) => {
    try {
        const { route_id, bus_id } = req.body;

        const route = await Route.findById(route_id);
        if (!route) return res.status(404).json({ message: 'Route not found' });

        route.assigned_bus_id = bus_id || null;
        await route.save();

        res.json({ message: 'Route assigned to Bus successfully', route });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getStudentTransports = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const allocations = await StudentTransport.find({ school_id })
            .populate('student_id', 'student_name roll_no admission_number class_id parent_name parent_phone')
            .populate('class_id', 'class_name section')
            .populate('route_id', 'route_name')
            .populate('bus_id', 'bus_number bus_name')
            .populate('pickup_stop_id', 'stop_name estimated_arrival_time')
            .sort({ createdAt: -1 });

        res.json(allocations);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const assignStudentTransport = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const { student_id, admission_number, class_id, route_id, bus_id, pickup_stop_id, drop_stop_id } = req.body;

        if (!student_id || !class_id || !route_id || !bus_id || !pickup_stop_id) {
            return res.status(400).json({ message: 'Student, Class, Route, Bus and Pickup Stop are required' });
        }

        const existing = await StudentTransport.findOne({ student_id });
        if (existing) {
            existing.route_id = route_id;
            existing.bus_id = bus_id;
            existing.pickup_stop_id = pickup_stop_id;
            existing.drop_stop_id = drop_stop_id || pickup_stop_id;
            existing.status = 'Active';
            await existing.save();
            return res.json({ message: 'Student transport updated successfully', allocation: existing });
        }

        const newAllocation = await StudentTransport.create({
            school_id,
            student_id,
            admission_number: admission_number || 'N/A',
            class_id,
            route_id,
            bus_id,
            pickup_stop_id,
            drop_stop_id: drop_stop_id || pickup_stop_id,
            status: 'Active'
        });

        res.status(201).json({ message: 'Student transport assigned successfully', allocation: newAllocation });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const removeStudentTransport = async (req, res) => {
    try {
        await StudentTransport.findByIdAndDelete(req.params.id);
        res.json({ message: 'Student transport unassigned successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 6. Real-Time Trip Execution & Live Location Streaming
// ----------------------------------------------------
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

        // Check if there is already an in-progress trip
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

        // Trigger automatic notification
        await TransportNotification.create({
            school_id: driver.school_id,
            bus_id: driver.assigned_bus_id._id,
            trip_id,
            title: 'Bus Trip Started',
            message: `Bus ${driver.assigned_bus_id.bus_number} (${route.route_name}) has started its journey.`,
            type: 'TripStarted',
            recipient_role: 'All'
        });

        // Emit Socket.IO Event if io attached
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
        console.error('Error starting trip:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateGpsLocation = async (req, res) => {
    try {
        const { latitude, longitude, speed } = req.body;
        const driver_id = req.user.id || req.user._id;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Latitude and Longitude are required' });
        }

        const activeTrip = await TripHistory.findOne({
            driver_id,
            status: 'In Progress'
        });

        if (!activeTrip) {
            return res.status(404).json({ message: 'No active trip found for this driver' });
        }

        // Fetch Route Stops to calculate closest stop & ETA
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

            // Calculate ETA based on speed or average 30km/h
            const currentSpeedKmh = speed && speed > 0 ? (speed * 3.6) : 30; // convert m/s to km/h if needed
            const remainingDist = minDistance; // distance to closest next stop
            const etaMins = Math.max(1, Math.round((remainingDist / Math.max(currentSpeedKmh, 10)) * 60));
            activeTrip.eta_minutes = etaMins;

            if (remainingDist <= 0.3) {
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

        // Broadcast to Socket.IO clients
        if (req.app.get('io')) {
            req.app.get('io').emit('bus_location_update', locationPayload);
        }

        res.json({ message: 'GPS location updated successfully', tripData: locationPayload });
    } catch (error) {
        console.error('Error updating GPS location:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const endTrip = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;

        const activeTrip = await TripHistory.findOne({
            driver_id,
            status: 'In Progress'
        });

        if (!activeTrip) {
            return res.status(404).json({ message: 'No active trip in progress' });
        }

        activeTrip.status = 'Completed';
        activeTrip.end_time = new Date();
        
        // Compute total distance travelled if GPS logs exist
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

        // Trigger notification
        await TransportNotification.create({
            school_id: activeTrip.school_id,
            bus_id: activeTrip.bus_id,
            trip_id: activeTrip.trip_id,
            title: 'Bus Trip Completed',
            message: `Bus trip ${activeTrip.trip_id} has arrived at School and ended safely.`,
            type: 'ReachedSchool',
            recipient_role: 'All'
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('trip_ended', { trip_id: activeTrip.trip_id });
        }

        res.json({ message: 'Trip ended successfully', trip: activeTrip });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const triggerEmergency = async (req, res) => {
    try {
        const driver_id = req.user.id || req.user._id;
        const activeTrip = await TripHistory.findOne({ driver_id, status: 'In Progress' })
            .populate('bus_id')
            .populate('driver_id');

        if (activeTrip) {
            activeTrip.status = 'Emergency';
            await activeTrip.save();
        }

        const notification = await TransportNotification.create({
            school_id: req.user.school_id,
            bus_id: activeTrip ? activeTrip.bus_id._id : req.body.bus_id,
            trip_id: activeTrip ? activeTrip.trip_id : '',
            title: '⚠️ EMERGENCY ALERT!',
            message: `EMERGENCY ALERT triggered by Driver ${activeTrip?.driver_id?.name || ''} for Bus ${activeTrip?.bus_id?.bus_number || ''}! Immediate attention required.`,
            type: 'Emergency',
            recipient_role: 'All'
        });

        if (req.app.get('io')) {
            req.app.get('io').emit('emergency_alert', notification);
        }

        res.json({ message: 'Emergency alert triggered and sent to School Admin', notification });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const forceStopTrip = async (req, res) => {
    try {
        const trip = await TripHistory.findById(req.params.tripId);
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        trip.status = 'Force Stopped';
        trip.end_time = new Date();
        await trip.save();

        if (req.app.get('io')) {
            req.app.get('io').emit('trip_ended', { trip_id: trip.trip_id });
        }

        res.json({ message: 'Trip force stopped by School Admin', trip });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ----------------------------------------------------
// 7. Tracking Portals for Admin, Teacher, & Parent
// ----------------------------------------------------
const getActiveTrips = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const activeTrips = await TripHistory.find({
            school_id,
            status: { $in: ['In Progress', 'Emergency'] }
        })
            .populate('bus_id', 'bus_number bus_name vehicle_reg_number total_seats')
            .populate('driver_id', 'name mobile_number photo license_number')
            .populate('route_id', 'route_name start_point end_point total_distance_km');

        const result = await Promise.all(activeTrips.map(async (t) => {
            const stops = await RouteStop.find({ route_id: t.route_id._id }).sort({ stop_order: 1 });
            return {
                ...t.toObject(),
                routeStops: stops
            };
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getParentChildBusTracking = async (req, res) => {
    try {
        const parent_user_id = req.user._id;
        const student = await Student.findOne({ parent_user_id });
        if (!student) {
            return res.status(404).json({ message: 'No student associated with this parent account' });
        }

        const transport = await StudentTransport.findOne({ student_id: student._id, status: 'Active' })
            .populate('route_id', 'route_name start_point end_point')
            .populate('bus_id', 'bus_number bus_name vehicle_reg_number')
            .populate('pickup_stop_id')
            .populate('drop_stop_id');

        if (!transport) {
            return res.json({ assigned: false, message: 'No transport allocation found for student' });
        }

        const driver = await Driver.findOne({ assigned_bus_id: transport.bus_id._id, status: 'Active' });
        const routeStops = await RouteStop.find({ route_id: transport.route_id._id }).sort({ stop_order: 1 });

        const activeTrip = await TripHistory.findOne({
            bus_id: transport.bus_id._id,
            status: { $in: ['In Progress', 'Emergency'] }
        });

        res.json({
            assigned: true,
            student,
            transport,
            driver,
            routeStops,
            activeTrip
        });
    } catch (error) {
        console.error('Error in parent bus tracking:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTripHistoryLogs = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const trips = await TripHistory.find({ school_id })
            .populate('bus_id', 'bus_number bus_name')
            .populate('driver_id', 'name mobile_number')
            .populate('route_id', 'route_name')
            .sort({ createdAt: -1 });

        res.json(trips);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const school_id = await getSchoolId(req.user);
        const notifications = await TransportNotification.find({ school_id })
            .populate('bus_id', 'bus_number bus_name')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
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
};
