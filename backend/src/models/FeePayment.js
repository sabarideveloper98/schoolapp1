const mongoose = require('mongoose');

const feePaymentBreakdownSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeCategory',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    fine_paid: {
        type: Number,
        default: 0
    },
    discount_applied: {
        type: Number,
        default: 0
    }
}, { _id: false });

const feePaymentSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    receipt_number: {
        type: String,
        required: true,
        unique: true
    },
    payment_date: {
        type: Date,
        default: Date.now
    },
    amount_paid: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Razorpay'],
        required: true
    },
    transaction_id: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    razorpay_order_id: {
        type: String,
        default: ''
    },
    razorpay_payment_id: {
        type: String,
        default: ''
    },
    razorpay_signature: {
        type: String,
        default: ''
    },
    payment_status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed'
    },
    breakdown: [feePaymentBreakdownSchema]
}, { timestamps: true });

module.exports = mongoose.model('FeePayment', feePaymentSchema);
