const mongoose = require('mongoose');

const teacherAssignmentSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    academic_year: {
        type: String,
        required: true,
        default: '2026-2027'
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    weekly_periods_required: {
        type: Number,
        default: 6
    },
    is_class_teacher: {
        type: Boolean,
        default: false
    },
    is_subject_teacher: {
        type: Boolean,
        default: true
    },
    is_lab_required: {
        type: Boolean,
        default: false
    },
    lab_type: {
        type: String,
        enum: ['Computer', 'Science', 'Language', 'None'],
        default: 'None'
    }
}, { timestamps: true });

teacherAssignmentSchema.index({ school_id: 1, class_id: 1, subject_id: 1, academic_year: 1 }, { unique: true });

const TeacherAssignment = mongoose.model('TeacherAssignment', teacherAssignmentSchema);
module.exports = TeacherAssignment;
