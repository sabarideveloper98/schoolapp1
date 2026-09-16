const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    file_url: {
        type: String,
        required: true
    },
    file_type: {
        type: String,
        enum: ['PDF', 'Image', 'Video', 'Document'],
        default: 'PDF'
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
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

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);
