const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => callback(null, true),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join_bus_room', (busId) => {
        socket.join(`bus_${busId}`);
    });
});

const path = require('path');

// Configure CORS
const corsOptions = {
    origin: function (origin, callback) {
        callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'x-access-token'
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Enable CORS as top-level middleware
app.use(cors(corsOptions));

// Explicit fallback headers middleware for CORS preflight and requests
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// Body parser
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swaggerSpec');

// Route files
const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const schoolAdminRoutes = require('./routes/schoolAdminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const parentRoutes = require('./routes/parentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const transportRoutes = require('./routes/transportRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const driverStaffRoutes = require('./routes/driverStaffRoutes');

// Swagger API Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/schooladmin', schoolAdminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/driver', driverStaffRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/timetable', timetableRoutes);

app.get('/', (req, res) => {
    res.send('School Management System API is running... Swagger docs available at /api-docs');
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

