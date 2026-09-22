const AuditLog = require('../models/AuditLog');

const logParentActivity = (actionDescription) => {
    return async (req, res, next) => {
        // Record log after response finishes
        res.on('finish', async () => {
            try {
                if (req.user && req.user._id) {
                    await AuditLog.create({
                        school_id: req.user.school_id || req.body?.school_id || '000000000000000000000000',
                        user_id: req.user._id,
                        action: actionDescription || `${req.method} ${req.originalUrl}`,
                        module: 'ParentModule',
                        details: `Status: ${res.statusCode} | Params: ${JSON.stringify(req.params)} | Query: ${JSON.stringify(req.query)}`,
                        ip_address: req.ip || req.headers['x-forwarded-for'] || ''
                    });
                }
            } catch (err) {
                // Silent fail for logging errors to keep API performant
                console.error('AuditLog error:', err.message);
            }
        });
        next();
    };
};

module.exports = { logParentActivity };
