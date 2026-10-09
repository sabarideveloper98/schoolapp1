const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const School = require('./models/School');
const Notification = require('./models/Notification');

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected successfully');
    } catch (error) {
        console.error('MongoDB Connection Error: ', error);
        process.exit(1);
    }
};

const seedNotifications = async () => {
    try {
        await connectDB();

        // 1. Get or find a School
        let school = await School.findOne();
        if (!school) {
            school = await School.create({
                name: 'Global Academy School',
                code: 'GA01',
                email: 'info@globalacademy.com',
                phone: '9876543210',
                location: 'Chennai'
            });
            console.log('Created default School:', school.name);
        }

        // 2. Find all Parent users (or all users if role is Parent)
        const parentUsers = await User.find({ role: 'Parent' });
        const allUsers = await User.find();
        console.log(`Found ${parentUsers.length} Parent user(s), Total users: ${allUsers.length}`);

        const targetUsers = parentUsers.length > 0 ? parentUsers : allUsers;

        if (targetUsers.length === 0) {
            console.log('No users found in database.');
            process.exit(0);
        }

        const dummyNotificationTemplates = [
            {
                type: 'Attendance Alerts',
                content: 'Your child was marked Present for today\'s morning session.',
                is_read: false
            },
            {
                type: 'Homework Alerts',
                content: 'Mathematics Homework on "Algebraic Equations" has been assigned. Due date: Friday.',
                is_read: false
            },
            {
                type: 'Exam Notifications',
                content: 'Mid-Term Examination 2026 timetable has been published. Exams begin Oct 15th.',
                is_read: true
            },
            {
                type: 'Fee Notifications',
                content: 'Term 2 Tuition Fee reminder: Please complete payment before Oct 25th to avoid late fee.',
                is_read: false
            },
            {
                type: 'School Announcements',
                content: 'Annual Sports Day will be held on Saturday, Oct 20th. Parents are cordially invited!',
                is_read: true
            },
            {
                type: 'Teacher Messages',
                content: 'Class Teacher sent a message: "Please review student\'s Science project progress."',
                is_read: false
            },
            {
                type: 'Bus Alerts',
                content: 'Bus TN-01-AB-1234 has departed from school depot and is en route on Route 4.',
                is_read: true
            },
            {
                type: 'Circular',
                content: 'Important Circular: School will remain closed on Oct 24th for Public Holiday.',
                is_read: false
            },
            {
                type: 'Attendance Alerts',
                content: 'Weekly attendance report: 100% attendance recorded for this week.',
                is_read: true
            },
            {
                type: 'Homework Alerts',
                content: 'Science Worksheet #4 submission status updated to Graded (Marks: 9/10).',
                is_read: true
            }
        ];

        const notificationsToInsert = [];

        for (const user of targetUsers) {
            for (const template of dummyNotificationTemplates) {
                notificationsToInsert.push({
                    type: template.type,
                    content: template.content,
                    school_id: school._id,
                    recipient_id: user._id,
                    is_read: template.is_read,
                    createdAt: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                    updatedAt: new Date()
                });
            }
        }

        const inserted = await Notification.insertMany(notificationsToInsert);
        console.log(`Successfully inserted ${inserted.length} dummy notification records into MongoDB!`);
        process.exit(0);
    } catch (error) {
        console.error('Error inserting dummy notifications:', error);
        process.exit(1);
    }
};

seedNotifications();
