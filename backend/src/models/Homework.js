const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    creator_name: {
        type: String,
        default: 'Teacher/Admin'
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: false
    },
    subject_name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    instructions: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['Class Work', 'Homework', 'Project Work', 'Assignment', 'Practical Work', 'Lab Activity'],
        default: 'Homework'
    },
    assignment_type: {
        type: String,
        enum: ['Student', 'Class', 'Section', 'MultipleClasses'],
        required: true
    },
    assigned_classes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class'
    }],
    assigned_section: {
        type: String,
        default: ''
    },
    assigned_students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    assigned_date: {
        type: Date,
        default: Date.now
    },
    due_date: {
        type: Date,
        required: true
    },
    attachment_url: {
        type: String,
        default: ''
    },
    video_link: {
        type: String,
        default: ''
    },
    max_marks: {
        type: Number,
        default: 100
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
