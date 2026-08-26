const mongoose = require('mongoose');

const staffAttendanceRecordSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Teacher', 'Staff'],
        required: true
    },
    status: {
        type: String,
        enum: ['Present', 'Absent'],
        required: true,
        default: 'Present'
    },
    in_time: {
        type: String,
        default: '09:00 AM'
    },
    out_time: {
        type: String,
        default: '05:00 PM'
    }
});

const staffAttendanceSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    role_filter: {
        type: String,
        required: true // 'Teacher' or 'Staff' (matching the role selected in UI)
    },
    records: [staffAttendanceRecordSchema],
    notify_via: {
        type: String,
        default: 'Do not send'
    }
}, { timestamps: true });

// Avoid duplicate attendance for same date, school, and role filter
staffAttendanceSchema.index({ school_id: 1, date: 1, role_filter: 1 }, { unique: true });

const StaffAttendance = mongoose.model('StaffAttendance', staffAttendanceSchema);
module.exports = StaffAttendance;
