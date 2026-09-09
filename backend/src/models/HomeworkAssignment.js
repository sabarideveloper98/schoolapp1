const mongoose = require('mongoose');

const homeworkAssignmentSchema = new mongoose.Schema({
    homework_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Homework',
        required: true
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: false
    },
    status: {
        type: String,
        enum: ['Pending', 'Submitted', 'Reviewed', 'Late'],
        default: 'Pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('HomeworkAssignment', homeworkAssignmentSchema);
