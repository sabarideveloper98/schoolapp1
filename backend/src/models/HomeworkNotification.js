const mongoose = require('mongoose');

const homeworkNotificationSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: false
    },
    homework_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: false
    },
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
        enum: ['Assigned', 'Updated', 'Submitted', 'Reviewed', 'DueApproaching'],
        default: 'Assigned'
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('HomeworkNotification', homeworkNotificationSchema);
