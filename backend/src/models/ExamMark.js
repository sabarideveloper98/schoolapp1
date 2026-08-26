const mongoose = require('mongoose');

const markEntrySchema = new mongoose.Schema({
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    marks_obtained: {
        type: Number,
        required: true,
        default: 0
    },
    total_marks: {
        type: Number,
        required: true,
        default: 100
    }
});

const examMarkSchema = new mongoose.Schema({
    exam_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
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
        required: true
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    marks: [markEntrySchema]
}, { timestamps: true });

// Enforce unique compound index per student per exam
examMarkSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

const ExamMark = mongoose.model('ExamMark', examMarkSchema);
module.exports = ExamMark;
