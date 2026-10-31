/**
 * Tenant Migration Script: Copy Existing School Operational Data to Dedicated School Database
 * Safe, idempotent, non-destructive (copies without deleting central originals until verified)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const School = require('../src/models/School');
const { CENTRAL_MODEL_NAMES, provisionTenantDatabase } = require('../src/services/tenantConnectionManager');

const migrateSchoolDataToDedicatedDb = async (schoolQuery) => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        const school = await School.findOne(schoolQuery);
        if (!school) {
            console.error('School not found for query:', schoolQuery);
            process.exit(1);
        }

        console.log(`\nMigrating school: ${school.name} (ID: ${school._id}) to dedicated DB: ${school.db_name}`);

        if (school.db_name === mongoose.connection.name) {
            console.log(`School already targets the central database (${school.db_name}). No data movement required.`);
            process.exit(0);
        }

        // 1. Provision collections & indexes on target tenant database
        console.log(`Provisioning target database ${school.db_name}...`);
        await provisionTenantDatabase(school.db_name);

        const tenantDb = mongoose.connection.useDb(school.db_name, { useCache: true });
        const centralDb = mongoose.connection.db;

        // 2. Discover all tenant collections
        const allCollections = await centralDb.listCollections().toArray();
        const tenantCollections = allCollections
            .map(c => c.name)
            .filter(n => !['schools', 'users', 'subscriptions', 'subscriptionconfigs', 'auditlogs'].includes(n));

        console.log(`Inspecting ${tenantCollections.length} collections for school records...`);

        let totalCopied = 0;

        for (const collName of tenantCollections) {
            // Find docs belonging to this school
            const docs = await centralDb.collection(collName).find({ school_id: school._id }).toArray();
            if (docs.length > 0) {
                console.log(`Collection [${collName}]: copying ${docs.length} documents...`);
                // Use ordered: false to skip duplicates if rerun
                try {
                    await tenantDb.db.collection(collName).insertMany(docs, { ordered: false });
                } catch (insertErr) {
                    // Ignore duplicate key errors on retry
                    if (insertErr.code !== 11000 && (!insertErr.writeErrors || !insertErr.writeErrors.every(e => e.code === 11000))) {
                        throw insertErr;
                    }
                }
                totalCopied += docs.length;
            }
        }

        console.log(`\nMigration complete for ${school.name}! Total records migrated: ${totalCopied}`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error during data migration:', error);
        process.exit(1);
    }
};

const targetSchoolName = process.argv[2] || 'Smart School';
migrateSchoolDataToDedicatedDb({ name: new RegExp(targetSchoolName, 'i') });
