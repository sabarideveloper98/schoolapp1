const mongoose = require('mongoose');

const driverAssignmentSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
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
        default: null
    },
    assigned_date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Active', 'Completed'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('DriverAssignment', driverAssignmentSchema);
