const mongoose = require('mongoose');

const unavailabilitySchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period_name: {
        type: String,
        required: true // e.g. 'P1', 'P3', 'P5'
    },
    reason: {
        type: String,
        default: 'Unavailable'
    }
}, { _id: false });

const teacherAvailabilitySchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    unavailabilities: [unavailabilitySchema]
}, { timestamps: true });

teacherAvailabilitySchema.index({ school_id: 1, teacher_id: 1 }, { unique: true });

const TeacherAvailability = mongoose.model('TeacherAvailability', teacherAvailabilitySchema);
module.exports = TeacherAvailability;
