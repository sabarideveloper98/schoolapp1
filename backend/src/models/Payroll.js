const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employee_name: {
        type: String,
        required: true
    },
    employee_role: {
        type: String,
        enum: ['Teacher', 'Staff'],
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    month: {
        type: Number,
        required: true
    },
    year: {
        type: Number,
        required: true
    },
    attendance_summary: {
        working_days: { type: Number, default: 0 },
        present_days: { type: Number, default: 0 },
        absent_days: { type: Number, default: 0 },
        half_days: { type: Number, default: 0 },
        paid_leaves: { type: Number, default: 0 }
    },
    salary_breakdown: {
        monthly_salary: { type: Number, default: 0 },
        per_day_salary: { type: Number, default: 0 },
        payable_days: { type: Number, default: 0 },
        gross_salary: { type: Number, default: 0 },
        allowances_total: { type: Number, default: 0 },
        deductions_total: { type: Number, default: 0 },
        net_salary: { type: Number, default: 0 },
        allowances: {
            hra: { type: Number, default: 0 },
            transport: { type: Number, default: 0 },
            medical: { type: Number, default: 0 },
            other: { type: Number, default: 0 }
        },
        deductions: {
            pf: { type: Number, default: 0 },
            esi: { type: Number, default: 0 },
            professional_tax: { type: Number, default: 0 },
            other: { type: Number, default: 0 }
        }
    },
    payment_details: {
        payment_method: {
            type: String,
            enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque', 'Unpaid'],
            default: 'Unpaid'
        },
        transaction_ref: { type: String, default: '' },
        payment_date: { type: Date }
    },
    status: {
        type: String,
        enum: ['Draft', 'Generated', 'Approved', 'Paid'],
        default: 'Draft'
    }
}, { timestamps: true });

// Ensure unique payroll per employee, month, and year
payrollSchema.index({ school_id: 1, user_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
