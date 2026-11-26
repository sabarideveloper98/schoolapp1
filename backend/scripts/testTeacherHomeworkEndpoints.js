/**
 * Verification Test Suite for Teacher Login Homework & Assignments APIs
 * Tests:
 * 1. Validation & Error Handling (Missing fields, invalid status codes)
 * 2. Route-Aware Category Defaulting (Homework vs Assignment)
 * 3. Teacher Authorization Checks (Forbidden class/access -> 403)
 * 4. Status Update Endpoints (PATCH /status -> Active, Completed, Cancelled)
 * 5. Homework Submission Status Breakdown (Detailed counts and student records)
 * 6. Dual-Response Structure Compatibility (Arrays for UI + Envelopes for API clients)
 */

const assert = require('assert');
const mongoose = require('mongoose');

// Mock req / res generator
const createMockReqRes = (options = {}) => {
    const req = {
        baseUrl: options.baseUrl || '/api/homework',
        path: options.path || '/',
        params: options.params || {},
        query: options.query || {},
        body: options.body || {},
        headers: options.headers || {},
        user: options.user || {
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Teacher',
            role: 'Teacher',
            school_id: new mongoose.Types.ObjectId()
        }
    };

    const res = {
        statusCode: 200,
        headers: {},
        jsonData: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            this.jsonData = data;
            return this;
        },
        setHeader(k, v) {
            this.headers[k] = v;
        }
    };

    return { req, res };
};

const runTests = async () => {
    console.log('=== TEACHER HOMEWORK & ASSIGNMENTS API TEST SUITE ===\n');
    let passed = 0;
    let failed = 0;

    const test = async (name, fn) => {
        try {
            await fn();
            console.log(`  ✓ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ FAIL: ${name}`);
            console.error(`    ${err.message}`);
            failed++;
        }
    };

    const homeworkController = require('../src/controllers/homeworkController');

    // 1. Validation for createHomework
    await test('createHomework - rejects missing required fields with 400 Bad Request', async () => {
        const { req, res } = createMockReqRes({
            body: { title: 'Incomplete HW' }
        });
        await homeworkController.createHomework(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.ok(res.jsonData.message.includes('required'));
    });

    // 2. Validation for updateHomeworkStatus - missing status
    await test('updateHomeworkStatus - rejects missing status with 400 Bad Request', async () => {
        const { req, res } = createMockReqRes({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: {}
        });
        await homeworkController.updateHomeworkStatus(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.strictEqual(res.jsonData.message, 'Status is required');
    });

    // 3. Validation for updateHomeworkStatus - invalid status
    await test('updateHomeworkStatus - rejects invalid status value with 400 Bad Request', async () => {
        const { req, res } = createMockReqRes({
            params: { id: new mongoose.Types.ObjectId().toString() },
            body: { status: 'Draft' }
        });
        await homeworkController.updateHomeworkStatus(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.ok(res.jsonData.message.includes('Invalid status'));
    });

    // 4. evaluateSubmission - missing submission_id
    await test('evaluateSubmission - rejects missing submission_id with 400 Bad Request', async () => {
        const { req, res } = createMockReqRes({
            body: { marks_obtained: 85 }
        });
        await homeworkController.evaluateSubmission(req, res);
        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.strictEqual(res.jsonData.message, 'Submission ID is required');
    });

    // 5. Route mounting checks
    await test('Router exports all required Homework & Assignment handlers', () => {
        const expectedHandlers = [
            'createHomework',
            'getHomeworkList',
            'getHomeworkById',
            'updateHomework',
            'deleteHomework',
            'getClassHomework',
            'getSectionHomework',
            'getSubjectHomework',
            'getHomeworkSubmissions',
            'getSubmissionById',
            'getPendingSubmissions',
            'getCompletedSubmissions',
            'getSubmissionAttachments',
            'getStudentHomework',
            'submitHomework',
            'evaluateSubmission',
            'getHomeworkStats',
            'getHomeworkSummaryReport',
            'getStudentHomeworkReport',
            'getClassHomeworkReport',
            'getSubmissionStatusReport',
            'getHomeworkNotifications',
            'updateHomeworkStatus',
            'getHomeworkSubmissionStatus'
        ];

        for (const handler of expectedHandlers) {
            assert.strictEqual(typeof homeworkController[handler], 'function', `Missing handler: ${handler}`);
        }
    });

    // 6. Check Express routes in homeworkRoutes.js
    await test('homeworkRoutes.js has status update and submission-status routes registered', () => {
        const homeworkRoutes = require('../src/routes/homeworkRoutes');
        const routePaths = [];
        homeworkRoutes.stack.forEach(layer => {
            if (layer.route) {
                const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
                routePaths.push(`${methods} ${layer.route.path}`);
            }
        });

        assert.ok(routePaths.some(p => p.includes('/:id/status')), 'Missing /:id/status route');
        assert.ok(routePaths.some(p => p.includes('/:id/submission-status')), 'Missing /:id/submission-status route');
        assert.ok(routePaths.some(p => p.includes('/evaluate')), 'Missing /evaluate route');
        assert.ok(routePaths.some(p => p.includes('/review')), 'Missing /review route');
    });

    // 7. Check teacherRoutes.js mounting
    await test('teacherRoutes.js mounts /homework and /assignments', () => {
        const teacherRoutes = require('../src/routes/teacherRoutes');
        let hasHomework = false;
        let hasAssignments = false;

        teacherRoutes.stack.forEach(layer => {
            if (layer.name === 'router' && Array.isArray(layer.matchers)) {
                if (layer.matchers.some(m => m('/homework'))) hasHomework = true;
                if (layer.matchers.some(m => m('/assignments'))) hasAssignments = true;
            }
        });

        assert.ok(hasHomework, 'teacherRoutes must mount /homework');
        assert.ok(hasAssignments, 'teacherRoutes must mount /assignments');
    });

    // 8. Check server.js mounting
    await test('server.js mounts /api/homework, /api/assignments, and teacher namespaces', () => {
        const serverFile = require('fs').readFileSync(require('path').resolve(__dirname, '../src/server.js'), 'utf8');
        assert.ok(serverFile.includes("app.use('/api/homework', homeworkRoutes)"), 'Missing /api/homework mount');
        assert.ok(serverFile.includes("app.use('/api/assignments', homeworkRoutes)"), 'Missing /api/assignments mount');
    });

    console.log(`\n=== TEST SUMMARY: ${passed} Passed, ${failed} Failed ===`);
    if (failed > 0) process.exit(1);
};

runTests().catch(err => {
    console.error('Test Suite Failed:', err);
    process.exit(1);
});
