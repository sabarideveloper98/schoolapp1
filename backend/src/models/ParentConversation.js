const mongoose = require('mongoose');

const parentMessageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender_role: {
        type: String,
        enum: ['Parent', 'Teacher', 'SchoolAdmin'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    attachment: {
        type: String,
        default: ''
    },
    read_at: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const parentConversationSchema = new mongoose.Schema({
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient_role: {
        type: String,
        enum: ['Class Teacher', 'Subject Teacher', 'SchoolAdmin'],
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
    subject: {
        type: String,
        required: true
    },
    last_message: {
        type: String,
        default: ''
    },
    last_message_at: {
        type: Date,
        default: Date.now
    },
    messages: [parentMessageSchema]
}, { timestamps: true });

const ParentConversation = mongoose.model('ParentConversation', parentConversationSchema);
module.exports = ParentConversation;
