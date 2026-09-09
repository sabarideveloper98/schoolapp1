const mongoose = require('mongoose');

const homeworkReviewSchema = new mongoose.Schema({
    submission_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'HomeworkSubmission',
        required: true
    },
    homework_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    evaluated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    marks_obtained: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Approved', 'Needs Improvement', 'Rejected'],
        default: 'Approved'
    },
    evaluated_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('HomeworkReview', homeworkReviewSchema);
