const School = require('../models/School');
const User = require('../models/User');
const { getTenantConnection, runInTenantContext } = require('../services/tenantConnectionManager');

/**
 * Resolve school details from a user document or token
 * @param {Object} user 
 * @param {Object} decodedToken 
 * @returns {Promise<Object|null>}
 */
const resolveUserSchool = async (user, decodedToken = {}) => {
    if (!user) return null;

    // SuperAdmin does not belong to a specific school
    if (user.role === 'SuperAdmin') {
        return null;
    }

    let school = null;

    // 1. Direct school_id on user object (School ObjectId or code)
    if (user.school_id) {
        school = await School.findById(user.school_id);
        if (!school) {
            school = await School.findOne({ school_id: user.school_id });
        }
    }

    // 2. For SchoolAdmin: check School.admin_id
    if (!school && user.role === 'SchoolAdmin') {
        school = await School.findOne({ admin_id: user._id || user.id });
    }

    // 3. From verified token payload claim
    if (!school && decodedToken.school_id) {
        school = await School.findById(decodedToken.school_id);
        if (!school) {
            school = await School.findOne({ school_id: decodedToken.school_id });
        }
    }

    // 4. Role-specific fallback lookups
    if (!school && user.reference_id) {
        // e.g. Teacher, Staff, Driver
        const role = user.role;
        try {
            if (role === 'Teacher') {
                const Teacher = require('../models/Teacher');
                const t = await Teacher.findById(user.reference_id);
                if (t && t.school_id) school = await School.findById(t.school_id);
            } else if (role === 'Staff') {
                const Staff = require('../models/Staff');
                const s = await Staff.findById(user.reference_id);
                if (s && s.school_id) school = await School.findById(s.school_id);
            } else if (role === 'Driver') {
                const Driver = require('../models/Driver');
                const d = await Driver.findById(user.reference_id);
                if (d && d.school_id) school = await School.findById(d.school_id);
            }
        } catch (e) {
            // Ignore error
        }
    }

    return school;
};

/**
 * Tenant Resolution Middleware
 * Attaches req.tenant = { schoolId, dbName, school, tenantDb }
 * Runs the remainder of the request inside the tenant execution context
 */
const tenantMiddleware = async (req, res, next) => {
    try {
        if (!req.user || req.user.role === 'SuperAdmin') {
            return next();
        }

        const school = await resolveUserSchool(req.user, req.decodedToken || {});

        if (!school) {
            // If the user has a role that requires a school but no school is associated
            if (req.user.role === 'SchoolAdmin') {
                return res.status(403).json({
                    success: false,
                    message: 'No school associated with this administrator account. Please contact SuperAdmin.'
                });
            }
            return next();
        }

        // Verify school status
        if (school.status && school.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: `School account is ${school.status.toLowerCase()}. Access denied.`
            });
        }

        // Determine tenant database name
        // Dedicated db_name if configured, otherwise central fallback or generated school_<id>
        const dbName = school.db_name || (school.school_id ? `school_${school.school_id.toLowerCase().replace(/[^a-z0-9_]/g, '_')}` : null);

        let tenantDb = null;
        if (dbName) {
            tenantDb = getTenantConnection(dbName);
        }

        // Attach tenant metadata to request
        req.tenant = {
            schoolId: school._id,
            uniqueSchoolId: school.school_id,
            dbName: dbName,
            school: school,
            tenantDb: tenantDb
        };

        // Attach school_id directly to req.user if not present
        if (!req.user.school_id) {
            req.user.school_id = school._id;
        }

        // Execute downstream handler inside the AsyncLocalStorage tenant context
        if (tenantDb) {
            return runInTenantContext({ tenantDb, schoolId: school._id, dbName }, () => {
                next();
            });
        }

        return next();
    } catch (error) {
        console.error('tenantMiddleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to resolve school tenant database',
            error: error.message
        });
    }
};

module.exports = {
    resolveUserSchool,
    tenantMiddleware
};
