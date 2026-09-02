const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error: ', error);
        process.exit(1);
    }
};

const seedAllUsers = async () => {
    try {
        await connectDB();

        const defaultUsers = [
            { email: 'admin@system.com', password: 'Admin@123', role: 'SuperAdmin' },
            { email: 'schooladmin@system.com', password: 'Admin@123', role: 'SchoolAdmin' },
            { email: 'teacher@system.com', password: 'Admin@123', role: 'Teacher' },
            { email: 'staff@system.com', password: 'Admin@123', role: 'Staff' },
            { email: 'parent@system.com', password: 'Admin@123', role: 'Parent' },
        ];

        for (const u of defaultUsers) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                const newUser = new User(u);
                await newUser.save();
                console.log(`Created demo user: ${u.email} (${u.role})`);
            } else {
                console.log(`Demo user already exists: ${u.email}`);
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users: ', error);
        process.exit(1);
    }
};

seedAllUsers();
