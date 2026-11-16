const { createTenantModelProxy } = require('../services/tenantConnectionManager');
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
    },
    passing_marks: {
        type: Number,
        required: false,
        default: 35
    },
    grade: {
        type: String,
        required: false
    },
    remarks: {
        type: String,
        required: false,
        default: ''
    },
    exam_date: {
        type: Date,
        required: false
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
    academic_year: {
        type: String,
        required: false,
        default: '2026-2027'
    },
    remarks: {
        type: String,
        required: false,
        default: ''
    },
    marks: [markEntrySchema]
}, { timestamps: true });

// Enforce unique compound index per student per exam
examMarkSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

const ExamMark = createTenantModelProxy('ExamMark', examMarkSchema);
module.exports = ExamMark;
