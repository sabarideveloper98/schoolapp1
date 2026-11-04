const { createTenantModelProxy } = require('../services/tenantConnectionManager');
const mongoose = require('mongoose');

const staffRoleSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Role name is required'],
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

// Avoid duplicate role name per school
staffRoleSchema.index({ school_id: 1, name: 1 }, { unique: true });

module.exports = createTenantModelProxy('StaffRole', staffRoleSchema);
