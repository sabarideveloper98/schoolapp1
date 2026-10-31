const { createTenantModelProxy } = require('../services/tenantConnectionManager');
const mongoose = require('mongoose');

const staffLeaveSchema = new mongoose.Schema({
    staff_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    leave_type: {
        type: String,
        enum: [
            'Casual Leave',
            'Sick Leave',
            'Emergency Leave',
            'Maternity / Paternity Leave',
            'Medical Leave',
            'Earned Leave',
            'Other'
        ],
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    admin_remarks: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = createTenantModelProxy('StaffLeave', staffLeaveSchema);
