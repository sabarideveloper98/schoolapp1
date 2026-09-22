const mongoose = require('mongoose');

const studentLeaveSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    parent_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    leave_type: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Emergency Leave', 'Family Function', 'Other'],
        required: true
    },
    from_date: {
        type: Date,
        required: true
    },
    to_date: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    attachment: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending'
    },
    reviewed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    review_comment: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const StudentLeave = mongoose.model('StudentLeave', studentLeaveSchema);
module.exports = StudentLeave;
