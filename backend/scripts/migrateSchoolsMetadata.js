/**
 * Automated Migration Script
 * Assigns unique school_id, code, and db_name metadata to existing schools
 * Links school_id to their respective SchoolAdmin users in the central database
 * Preserves all existing school data without data loss
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const School = require('../src/models/School');
const User = require('../src/models/User');

const migrateExistingSchools = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to default database:', mongoose.connection.name);

        const schools = await School.find({});
        console.log(`Found ${schools.length} existing schools to inspect.`);

        let updatedSchoolsCount = 0;
        let updatedUsersCount = 0;

        for (const school of schools) {
            let isModified = false;

            // Generate clean code if missing
            if (!school.code) {
                const baseCode = (school.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'SCH').toUpperCase();
                let codeCandidate = baseCode;
                let counter = 1;
                while (await School.findOne({ code: codeCandidate, _id: { $ne: school._id } })) {
                    codeCandidate = `${baseCode}${counter++}`;
                }
                school.code = codeCandidate;
                isModified = true;
            }

            // Generate unique school_id if missing
            if (!school.school_id) {
                school.school_id = `SCH_${school._id.toString().slice(-6).toUpperCase()}`;
                isModified = true;
            }

            // Set unique db_name per school
            if (!school.db_name) {
                const cleanSuffix = (school.code || school.name).toLowerCase().replace(/[^a-z0-9_]/g, '_');
                let candidateDb = `school_${cleanSuffix}`;
                let dbCounter = 1;
                while (await School.findOne({ db_name: candidateDb, _id: { $ne: school._id } })) {
                    candidateDb = `school_${cleanSuffix}_${dbCounter++}`;
                }
                school.db_name = candidateDb;
                isModified = true;
            }

            if (!school.status) {
                school.status = 'Active';
                isModified = true;
            }

            if (!school.provisioning_status) {
                school.provisioning_status = 'ready';
                isModified = true;
            }

            if (isModified) {
                await school.save();
                updatedSchoolsCount++;
                console.log(`Updated School [${school.name}] -> code: ${school.code}, school_id: ${school.school_id}, db_name: ${school.db_name}`);
            }

            // Link school_id to the associated SchoolAdmin user in central DB
            if (school.admin_id) {
                const adminUser = await User.findById(school.admin_id);
                if (adminUser && (!adminUser.school_id || adminUser.school_id.toString() !== school._id.toString())) {
                    adminUser.school_id = school._id;
                    await adminUser.save();
                    updatedUsersCount++;
                    console.log(`Linked SchoolAdmin User [${adminUser.email}] to School [${school.name}]`);
                }
            }
        }

        console.log('\n--- MIGRATION COMPLETED SUCCESSFULLY ---');
        console.log(`Schools metadata updated: ${updatedSchoolsCount}`);
        console.log(`SchoolAdmin users linked: ${updatedUsersCount}`);

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateExistingSchools();
