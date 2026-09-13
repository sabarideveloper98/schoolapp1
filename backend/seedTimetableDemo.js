const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const School = require('./src/models/School');
const Class = require('./src/models/Class');
const Teacher = require('./src/models/Teacher');
const Subject = require('./src/models/Subject');
const TeacherAssignment = require('./src/models/TeacherAssignment');
const { generateTimetables } = require('./src/services/timetableGeneratorService');

const seedDemoTimetable = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('DB Connected');

        const school = await School.findOne();
        const classes = await Class.find();
        const teachers = await Teacher.find();
        const subjects = await Subject.find();

        console.log('Found School:', school?.name || school?._id);
        console.log('Found Classes:', classes.length);
        console.log('Found Teachers:', teachers.length);
        console.log('Found Subjects:', subjects.length);

        if (school && classes.length > 0 && teachers.length > 0 && subjects.length > 0) {
            for (const cls of classes) {
                for (let i = 0; i < subjects.length; i++) {
                    const subj = subjects[i];
                    const teacher = teachers[i % teachers.length];
                    await TeacherAssignment.findOneAndUpdate(
                        { school_id: school._id, class_id: cls._id, subject_id: subj._id, academic_year: '2026-2027' },
                        {
                            school_id: school._id,
                            academic_year: '2026-2027',
                            teacher_id: teacher._id,
                            subject_id: subj._id,
                            class_id: cls._id,
                            weekly_periods_required: 6,
                            is_class_teacher: (i === 0),
                            is_subject_teacher: true
                        },
                        { upsert: true, new: true }
                    );
                }
            }
            console.log('Teacher assignments seeded successfully!');

            // Run auto timetable generator solver
            await generateTimetables(school._id, '2026-2027');
            console.log('Timetables auto-generated & published successfully!');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error during demo timetable seeding:', err);
        process.exit(1);
    }
};

seedDemoTimetable();
