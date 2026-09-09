const mongoose = require('mongoose');

const homeworkSubmissionSchema = new mongoose.Schema({
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
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    submission_notes: {
        type: String,
        default: ''
    },
    attachment_url: {
        type: String,
        default: ''
    },
    submitted_at: {
        type: Date,
        default: Date.now
    },
    is_late: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
