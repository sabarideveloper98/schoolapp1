const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    class: {
        type: String, // Standard
        required: true,
    },
    section: {
        type: String,
        required: true,
    },
    no_student: {
        type: Number,
        required: true,
        default: 0,
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    class_incharge_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: false, // Could be unassigned initially
    }
}, { timestamps: true });

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
