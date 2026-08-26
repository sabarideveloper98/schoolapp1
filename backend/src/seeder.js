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

const seedSuperAdmin = async () => {
    try {
        await connectDB();

        const superAdminExists = await User.findOne({ email: 'admin@system.com' });

        if (superAdminExists) {
            console.log('Super Admin already exists!');
            process.exit(0);
        }

        const superAdmin = new User({
            email: 'admin@system.com',
            password: 'Admin@123',
            role: 'SuperAdmin'
        });

        await superAdmin.save();
        console.log('Super Admin account created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding Super Admin: ', error);
        process.exit(1);
    }
};

seedSuperAdmin();
