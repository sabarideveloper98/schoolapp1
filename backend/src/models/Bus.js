const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    bus_number: {
        type: String,
        required: true,
        trim: true
    },
    vehicle_reg_number: {
        type: String,
        required: true,
        trim: true
    },
    bus_name: {
        type: String,
        required: true,
        trim: true
    },
    bus_type: {
        type: String,
        enum: ['Bus', 'Van', 'Mini Bus', 'AC Bus'],
        default: 'Bus'
    },
    total_seats: {
        type: Number,
        required: true,
        min: 1
    },
    gps_enabled: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ['Active', 'Maintenance', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('Bus', busSchema);
