const mongoose = require('mongoose');

const feeDiscountSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['Percentage', 'Fixed'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    reason: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    }
}, { timestamps: true });

feeDiscountSchema.index({ school_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FeeDiscount', feeDiscountSchema);
