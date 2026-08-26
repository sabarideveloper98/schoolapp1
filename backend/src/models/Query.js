const mongoose = require('mongoose');

const queryMessageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
});

const querySchema = new mongoose.Schema({
    subject: {
        type: String,
        required: true,
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The class incharge
        required: true,
    },
    status: {
        type: String,
        enum: ['Open', 'Resolved', 'Archived'],
        default: 'Open',
    },
    history: [queryMessageSchema]
}, { timestamps: true });

const Query = mongoose.model('Query', querySchema);
module.exports = Query;
