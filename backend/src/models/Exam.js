const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    term: {
        type: String,
        required: false
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    }
}, { timestamps: true });

// Avoid duplicate exam names in the same school
examSchema.index({ school_id: 1, name: 1 }, { unique: true });

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
