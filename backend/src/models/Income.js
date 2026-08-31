const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    income_id: {
        type: String,
        required: true,
        unique: true
    },
    income_date: {
        type: Date,
        default: Date.now
    },
    income_type: {
        type: String,
        enum: ['Admission Fee', 'Student Fee Collection', 'Transport Fee', 'Hostel Fee', 'Donation', 'Sponsorship', 'Other Income'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online Payment'],
        required: true
    },
    reference_number: {
        type: String,
        default: ''
    },
    description: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Income', incomeSchema);
