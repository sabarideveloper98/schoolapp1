const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    expense_id: {
        type: String,
        required: true,
        unique: true
    },
    expense_date: {
        type: Date,
        default: Date.now
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
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
    },
    attachment_url: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Paid', 'Pending'],
        default: 'Paid'
    }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
