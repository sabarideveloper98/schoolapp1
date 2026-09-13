const mongoose = require('mongoose');

const conflictLogSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    academic_year: {
        type: String,
        required: true,
        default: '2026-2027'
    },
    conflict_type: {
        type: String,
        enum: ['Teacher Conflict', 'Room Conflict', 'Subject Frequency Conflict', 'Teacher Workload Conflict', 'Teacher Unavailability Conflict'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: false
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false
    },
    day: {
        type: String,
        required: false
    },
    period_name: {
        type: String,
        required: false
    },
    severity: {
        type: String,
        enum: ['Error', 'Warning'],
        default: 'Error'
    }
}, { timestamps: true });

const ConflictLog = mongoose.model('ConflictLog', conflictLogSchema);
module.exports = ConflictLog;
