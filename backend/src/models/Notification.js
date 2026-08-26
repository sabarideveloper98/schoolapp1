const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String, // e.g., 'Circular', 'Announcement', 'Message'
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    recipient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Usually a Parent or Teacher
        required: true,
    },
    is_read: {
        type: Boolean,
        default: false,
    },
    related_entity_id: {
        type: mongoose.Schema.Types.ObjectId, // Could be a Message ID or Query ID
        required: false,
    }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
