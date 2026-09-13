const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    period_name: { type: String, required: true }, // e.g. 'P1', 'Short Break', 'Lunch'
    start_time: { type: String, required: true },  // e.g. '09:20 AM'
    end_time: { type: String, required: true },    // e.g. '10:00 AM'
    type: { type: String, enum: ['Teaching Period', 'Break', 'Lunch'], default: 'Teaching Period' },
    is_lunch: { type: Boolean, default: false },
    is_break: { type: Boolean, default: false }
}, { _id: false });

const timetableSettingsSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        unique: true
    },
    academic_year: {
        type: String,
        required: true,
        default: '2026-2027'
    },
    school_start_time: {
        type: String,
        default: '08:45 AM'
    },
    school_end_time: {
        type: String,
        default: '02:25 PM'
    },
    period_duration: {
        type: Number, // in minutes
        default: 40
    },
    lunch_duration: {
        type: Number, // in minutes
        default: 20
    },
    lunch_after_period: {
        type: Number,
        default: 4
    },
    periods_per_day: {
        type: Number,
        default: 8
    },
    working_days: {
        type: [String],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    saturday_half_day: {
        type: Boolean,
        default: true
    },
    saturday_periods: {
        type: Number,
        default: 4
    },
    max_teacher_weekly_periods: {
        type: Number,
        default: 36
    },
    generated_periods: [periodSchema]
}, { timestamps: true });

const TimetableSettings = mongoose.model('TimetableSettings', timetableSettingsSchema);
module.exports = TimetableSettings;
