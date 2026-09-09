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

// Initialize Socket.IO
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    socket.on('join_bus_room', (busId) => {
        socket.join(`bus_${busId}`);
    });
});

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Route files
const authRoutes = require('./routes/authRoutes');
const superAdminRoutes = require('./routes/superAdminRoutes');
const schoolAdminRoutes = require('./routes/schoolAdminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const parentRoutes = require('./routes/parentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const transportRoutes = require('./routes/transportRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superAdminRoutes);
app.use('/api/schooladmin', schoolAdminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/homework', homeworkRoutes);

app.get('/', (req, res) => {
    res.send('School Management System API is running...');
});

const PORT = 5005;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

