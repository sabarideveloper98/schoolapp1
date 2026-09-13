const mongoose = require('mongoose');

const timetableMasterSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    academic_year_id: {
        type: String,
        required: true,
        default: '2026-2027'
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    section_id: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published'],
        default: 'Draft'
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

timetableMasterSchema.index({ school_id: 1, class_id: 1, section_id: 1, academic_year_id: 1 }, { unique: true });

const TimetableMaster = mongoose.model('TimetableMaster', timetableMasterSchema);
module.exports = TimetableMaster;
