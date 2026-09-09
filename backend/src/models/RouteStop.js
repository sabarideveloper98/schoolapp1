const mongoose = require('mongoose');

const routeStopSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    stop_name: {
        type: String,
        required: true,
        trim: true
    },
    stop_address: {
        type: String,
        default: ''
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    stop_order: {
        type: Number,
        required: true
    },
    estimated_arrival_time: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('RouteStop', routeStopSchema);
