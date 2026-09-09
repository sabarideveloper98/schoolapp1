const mongoose = require('mongoose');

const transportNotificationSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    trip_id: {
        type: String,
        required: false
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['TripStarted', 'ApproachingStop', 'ReachedStop', 'Delayed', 'ReachedSchool', 'Emergency', 'Custom'],
        default: 'Custom'
    },
    recipient_role: {
        type: String,
        enum: ['Parent', 'SchoolAdmin', 'Teacher', 'All'],
        default: 'All'
    },
    recipient_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    }
}, { timestamps: true });

module.exports = mongoose.model('TransportNotification', transportNotificationSchema);
