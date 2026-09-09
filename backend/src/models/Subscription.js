const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    student_count: {
        type: Number,
        required: true,
        min: 1
    },
    selected_duration: {
        type: String,
        required: true,
        enum: ['1 Year', '2 Years', '3 Years', '5 Years']
    },
    duration_years: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 5]
    },
    price_per_student: {
        type: Number,
        required: true
    },
    total_amount: {
        type: Number,
        required: true
    },
    payment_id: {
        type: String,
        required: true
    },
    razorpay_order_id: {
        type: String
    },
    razorpay_payment_id: {
        type: String
    },
    razorpay_signature: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Expired', 'Pending', 'Cancelled'],
        default: 'Active'
    },
    subscription_start_date: {
        type: Date,
        default: Date.now,
        required: true
    },
    subscription_end_date: {
        type: Date,
        required: true
    },
    invoice_number: {
        type: String,
        required: true,
        unique: true
    }
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
