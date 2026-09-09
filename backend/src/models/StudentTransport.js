const mongoose = require('mongoose');

const studentTransportSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    admission_number: {
        type: String,
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    route_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    pickup_stop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RouteStop',
        required: true
    },
    drop_stop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RouteStop',
        required: false
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

module.exports = mongoose.model('StudentTransport', studentTransportSchema);
