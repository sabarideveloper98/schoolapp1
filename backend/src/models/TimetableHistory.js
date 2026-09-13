const mongoose = require('mongoose');

const timetableHistorySchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    academic_year: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['Created', 'Updated', 'Published', 'Auto-Generated'],
        required: true
    },
    changes: {
        type: Object,
        default: {}
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

const TimetableHistory = mongoose.model('TimetableHistory', timetableHistorySchema);
module.exports = TimetableHistory;
