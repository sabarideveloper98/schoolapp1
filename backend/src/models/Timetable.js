const mongoose = require('mongoose');

const scheduleSlotSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period_name: {
        type: String, // 'P1', 'P2', 'Lunch', etc.
        required: true
    },
    subject_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: false
    },
    teacher_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false
    },
    is_lab: {
        type: Boolean,
        default: false
    },
    lab_type: {
        type: String,
        default: 'None'
    },
    room: {
        type: String,
        default: 'Main Classroom'
    },
    is_fixed: {
        type: Boolean,
        default: false // Lunch, PT, fixed slots
    }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    academic_year: {
        type: String,
        required: true,
        default: '2026-2027'
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Draft'
    },
    schedule: [scheduleSlotSchema]
}, { timestamps: true });

timetableSchema.index({ school_id: 1, class_id: 1, academic_year: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;
