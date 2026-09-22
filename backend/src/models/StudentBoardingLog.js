const mongoose = require('mongoose');

const studentBoardingLogSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    trip_id: {
        type: String,
        required: true
    },
    bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    stop_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RouteStop',
        required: false
    },
    stop_name: {
        type: String,
        default: ''
    },
    action_type: {
        type: String,
        enum: ['Boarded', 'Dropped', 'Absent'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const StudentBoardingLog = mongoose.model('StudentBoardingLog', studentBoardingLogSchema);
module.exports = StudentBoardingLog;
