const { createTenantModelProxy } = require('../services/tenantConnectionManager');
const mongoose = require('mongoose');

const commonSubjectSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Subject code is required'],
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active',
        index: true
    }
}, { timestamps: true });

// Prevent duplicate subject name or code per school (case-insensitive indexing handled in controller as well)
commonSubjectSchema.index({ school_id: 1, name: 1 }, { unique: true });
commonSubjectSchema.index({ school_id: 1, code: 1 }, { unique: true });

const CommonSubject = createTenantModelProxy('CommonSubject', commonSubjectSchema);
module.exports = CommonSubject;
