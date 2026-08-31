const mongoose = require('mongoose');

const feeStructureItemSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeCategory',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    due_date: {
        type: Date,
        required: true
    },
    fine_type: {
        type: String,
        enum: ['Daily', 'Weekly', 'Fixed', 'None'],
        default: 'None'
    },
    fine_amount: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const feeStructureSchema = new mongoose.Schema({
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
    items: [feeStructureItemSchema],
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

feeStructureSchema.index({ school_id: 1, class_id: 1, academic_year: 1 }, { unique: true });

module.exports = mongoose.model('FeeStructure', feeStructureSchema);
