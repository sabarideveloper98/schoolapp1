const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    attachment: {
        type: String,
        required: false,
    },
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Usually a Teacher
        required: true,
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    receiver_type: {
        type: String,
        enum: ['Class', 'Student', 'Multiple'],
        required: true,
    },
    receiver_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        // Could refer to Class IDs or Student IDs depending on receiver_type
        // We'll handle resolution in the controllers.
        required: true,
    }]
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
