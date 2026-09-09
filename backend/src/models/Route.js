const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    route_id: {
        type: String,
        required: true,
        trim: true
    },
    route_name: {
        type: String,
        required: true,
        trim: true
    },
    start_point: {
        type: String,
        required: true,
        trim: true
    },
    end_point: {
        type: String,
        required: true,
        trim: true
    },
    total_distance_km: {
        type: Number,
        default: 0
    },
    estimated_duration_mins: {
        type: Number,
        default: 0
    },
    assigned_bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        default: null
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
