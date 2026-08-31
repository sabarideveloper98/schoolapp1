const mongoose = require('mongoose');

const feeCategorySchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    academic_year: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

// Avoid duplicate category name per school and academic year
feeCategorySchema.index({ school_id: 1, name: 1, academic_year: 1 }, { unique: true });

module.exports = mongoose.model('FeeCategory', feeCategorySchema);
