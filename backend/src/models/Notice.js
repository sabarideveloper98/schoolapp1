const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['General Notice', 'Homework Reminder', 'Attendance Alert', 'Exam Notification'],
        default: 'General Notice'
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
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
    target_type: {
        type: String,
        enum: ['Entire Class', 'Specific Students'],
        default: 'Entire Class'
    },
    student_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Notice', noticeSchema);
