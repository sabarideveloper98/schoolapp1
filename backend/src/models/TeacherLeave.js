const mongoose = require('mongoose');

const teacherLeaveSchema = new mongoose.Schema({
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    leave_type: {
        type: String,
        enum: ['Casual Leave', 'Sick Leave', 'Emergency Leave'],
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
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    admin_remarks: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('TeacherLeave', teacherLeaveSchema);
