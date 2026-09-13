const mongoose = require('mongoose');

const timetableEntrySchema = new mongoose.Schema({
    timetable_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TimetableMaster',
        required: true
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    period_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PeriodConfig',
        required: false
    },
    period_name: {
        type: String,
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
    room_no: {
        type: String,
        default: ''
    },
    remarks: {
        type: String,
        default: ''
    }
}, { timestamps: true });

const TimetableEntry = mongoose.model('TimetableEntry', timetableEntrySchema);
module.exports = TimetableEntry;
