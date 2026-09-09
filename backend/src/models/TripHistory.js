const mongoose = require('mongoose');

const tripHistorySchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    trip_id: {
        type: String,
        required: true,
        unique: true
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    start_time: {
        type: Date,
        default: Date.now
    },
    end_time: {
        type: Date
    },
    status: {
        type: String,
        enum: ['In Progress', 'Completed', 'Force Stopped', 'Emergency'],
        default: 'In Progress'
    },
    distance_travelled_km: {
        type: Number,
        default: 0
    },
    current_latitude: {
        type: Number
    },
    current_longitude: {
        type: Number
    },
    current_speed: {
        type: Number,
        default: 0
    },
    previous_stop: {
        type: String,
        default: 'N/A'
    },
    current_stop: {
        type: String,
        default: 'In Transit'
    },
    next_stop: {
        type: String,
        default: 'N/A'
    },
    eta_minutes: {
        type: Number,
        default: 0
    },
    arrival_status: {
        type: String,
        enum: ['On Time', 'Delayed', 'Arriving Soon'],
        default: 'On Time'
    },
    gps_logs: [{
        latitude: Number,
        longitude: Number,
        speed: Number,
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('TripHistory', tripHistorySchema);
