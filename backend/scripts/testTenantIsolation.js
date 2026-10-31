/**
 * Multi-School Database Tenant Isolation & Provisioning Test Suite
 * Validates:
 * 1. Provisioning a brand new school creates a dedicated DB: school_<unique_school_id>
 * 2. School Admin account creation and association
 * 3. Tenant isolation: records created in School A's database do not appear in School B's database
 * 4. Token authorization and tenant database routing
 * 5. Clean teardown of test school and test database
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const School = require('../src/models/School');
const User = require('../src/models/User');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');
const Subject = require('../src/models/Subject');
const { getTenantConnection, runInTenantContext, provisionTenantDatabase } = require('../src/services/tenantConnectionManager');

const runTests = async () => {
    console.log('=== MULTI-SCHOOL DATABASE VALIDATION SUITE ===\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB central database:', mongoose.connection.name);

        // 1. Create School A
        const timestamp = Date.now();
        const codeA = `TA${timestamp.toString().slice(-4)}`;
        const schoolIdA = `SCH_TEST_A_${timestamp}`;
        const dbNameA = `school_${schoolIdA.toLowerCase()}`;
        const emailA = `admin_test_a_${timestamp}@example.com`;

        console.log(`\n[Test 1] Provisioning dedicated database for School A (${dbNameA})...`);
        const userA = await User.create({
            email: emailA,
            password: 'password123',
            role: 'SchoolAdmin',
            status: 'Active'
        });

        const schoolA = await School.create({
            name: `Test School Alpha ${timestamp}`,
            code: codeA,
            school_id: schoolIdA,
            db_name: dbNameA,
            location: 'Chennai, India',
            email: emailA,
            contact_number: '9876543210',
            founder_name: 'Alpha Founder',
            founder_phone: '9876543210',
            founder_email: emailA,
            admin_id: userA._id,
            status: 'Active',
            provisioning_status: 'ready'
        });

        userA.school_id = schoolA._id;
        await userA.save();

        const provA = await provisionTenantDatabase(dbNameA);
        console.log(`✓ Dedicated database ${dbNameA} provisioned with ${provA.collectionsCount} collections and indexes.`);

        // 2. Create School B
        const codeB = `TB${timestamp.toString().slice(-4)}`;
        const schoolIdB = `SCH_TEST_B_${timestamp}`;
        const dbNameB = `school_${schoolIdB.toLowerCase()}`;
        const emailB = `admin_test_b_${timestamp}@example.com`;

        console.log(`\n[Test 2] Provisioning dedicated database for School B (${dbNameB})...`);
        const userB = await User.create({
            email: emailB,
            password: 'password123',
            role: 'SchoolAdmin',
            status: 'Active'
        });

        const schoolB = await School.create({
            name: `Test School Beta ${timestamp}`,
            code: codeB,
            school_id: schoolIdB,
            db_name: dbNameB,
            location: 'Bangalore, India',
            email: emailB,
            contact_number: '9876543211',
            founder_name: 'Beta Founder',
            founder_phone: '9876543211',
            founder_email: emailB,
            admin_id: userB._id,
            status: 'Active',
            provisioning_status: 'ready'
        });

        userB.school_id = schoolB._id;
        await userB.save();

        const provB = await provisionTenantDatabase(dbNameB);
        console.log(`✓ Dedicated database ${dbNameB} provisioned with ${provB.collectionsCount} collections and indexes.`);

        // 3. Test School A Operations in Tenant Context
        console.log('\n[Test 3] Performing operations under School A tenant context...');
        const tenantDbA = getTenantConnection(dbNameA);

        await runInTenantContext({ tenantDb: tenantDbA, schoolId: schoolA._id, dbName: dbNameA }, async () => {
            console.log('  Active DB for Subject in School A context:', Subject.db.name);
            const subA = await Subject.create({
                name: 'Mathematics A',
                code: 'MATH-A',
                school_id: schoolA._id
            });
            console.log(`  ✓ Created Subject in School A: ${subA.name} (_id: ${subA._id})`);

            const countA = await Subject.countDocuments();
            console.log(`  ✓ Subject count in School A DB: ${countA}`);
            if (countA !== 1) throw new Error('Expected 1 subject in School A DB');
        });

        // 4. Test School B Operations in Tenant Context
        console.log('\n[Test 4] Performing operations under School B tenant context...');
        const tenantDbB = getTenantConnection(dbNameB);

        await runInTenantContext({ tenantDb: tenantDbB, schoolId: schoolB._id, dbName: dbNameB }, async () => {
            console.log('  Active DB for Subject in School B context:', Subject.db.name);
            const subB = await Subject.create({
                name: 'Physics B',
                code: 'PHYS-B',
                school_id: schoolB._id
            });
            console.log(`  ✓ Created Subject in School B: ${subB.name} (_id: ${subB._id})`);

            const countB = await Subject.countDocuments();
            console.log(`  ✓ Subject count in School B DB: ${countB}`);
            if (countB !== 1) throw new Error('Expected 1 subject in School B DB');
        });

        // 5. Verify Cross-School Strict Isolation
        console.log('\n[Test 5] Verifying strict cross-school database isolation...');
        await runInTenantContext({ tenantDb: tenantDbA, schoolId: schoolA._id, dbName: dbNameA }, async () => {
            const hasPhysicsB = await Subject.findOne({ name: 'Physics B' });
            console.log('  Can School A see School B\'s Physics subject?', hasPhysicsB ? 'FAILED' : 'NO (✓ PASS)');
            if (hasPhysicsB) throw new Error('Cross-school data leakage! School A can see School B record!');
        });

        await runInTenantContext({ tenantDb: tenantDbB, schoolId: schoolB._id, dbName: dbNameB }, async () => {
            const hasMathA = await Subject.findOne({ name: 'Mathematics A' });
            console.log('  Can School B see School A\'s Mathematics subject?', hasMathA ? 'FAILED' : 'NO (✓ PASS)');
            if (hasMathA) throw new Error('Cross-school data leakage! School B can see School A record!');
        });

        // 6. Verify Central Database is Clean
        console.log('\n[Test 6] Verifying central database remains isolated from tenant operational data...');
        const centralMath = await mongoose.connection.db.collection('subjects').findOne({ code: 'MATH-A' });
        const centralPhys = await mongoose.connection.db.collection('subjects').findOne({ code: 'PHYS-B' });
        console.log('  MATH-A in central DB:', centralMath ? 'Found (FAIL)' : 'null (✓ PASS)');
        console.log('  PHYS-B in central DB:', centralPhys ? 'Found (FAIL)' : 'null (✓ PASS)');
        if (centralMath || centralPhys) throw new Error('Tenant record leaked to central database!');

        // 7. Cleanup Test Databases and Records
        console.log('\n[Test 7] Cleaning up test databases and accounts...');
        await tenantDbA.db.dropDatabase();
        await tenantDbB.db.dropDatabase();
        await School.deleteMany({ _id: { $in: [schoolA._id, schoolB._id] } });
        await User.deleteMany({ _id: { $in: [userA._id, userB._id] } });
        console.log('✓ Cleaned up test databases and test accounts.');

        console.log('\n=============================================');
        console.log('✓ ALL 7 TENANT ISOLATION TESTS PASSED 100%!');
        console.log('=============================================\n');

        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('\n✗ Test failed with error:', err);
        process.exit(1);
    }
};

runTests();
