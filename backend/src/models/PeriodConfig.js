const mongoose = require('mongoose');

const periodConfigSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    period_name: {
        type: String, // e.g. 'P1', 'Break', 'P3', 'Lunch'
        required: true
    },
    start_time: {
        type: String, // e.g. '09:00 AM'
        required: true
    },
    end_time: {
        type: String, // e.g. '09:45 AM'
        required: true
    },
    type: {
        type: String,
        enum: ['Teaching Period', 'Break', 'Lunch'],
        default: 'Teaching Period'
    },
    is_lunch: {
        type: Boolean,
        default: false
    },
    is_break: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

const PeriodConfig = mongoose.model('PeriodConfig', periodConfigSchema);
module.exports = PeriodConfig;
