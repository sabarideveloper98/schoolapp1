const mongoose = require('mongoose');

const studentFeeItemSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeCategory',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    due_date: {
        type: Date,
        required: true
    },
    fine_type: {
        type: String,
        default: 'None'
    },
    fine_amount: {
        type: Number,
        default: 0
    },
    discount_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FeeDiscount',
        default: null
    },
    discount_amount: {
        type: Number,
        default: 0
    },
    fine_calculated: {
        type: Number,
        default: 0
    },
    paid_amount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Unpaid', 'Partial', 'Paid'],
        default: 'Unpaid'
    }
}, { _id: false });

const studentRefundItemSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    ref_no: {
        type: String,
        default: ''
    }
});

const studentFeeSchema = new mongoose.Schema({
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
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    academic_year: {
        type: String,
        required: true
    },
    items: [studentFeeItemSchema],
    refunds: [studentRefundItemSchema]
}, { timestamps: true });

studentFeeSchema.index({ school_id: 1, student_id: 1, academic_year: 1 }, { unique: true });

module.exports = mongoose.model('StudentFee', studentFeeSchema);
