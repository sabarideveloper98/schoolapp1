const mongoose = require('mongoose');

const allowanceSchema = new mongoose.Schema({
    hra: { type: Number, default: 0 },
    transport: { type: Number, default: 0 },
    medical: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
}, { _id: false });

const deductionSchema = new mongoose.Schema({
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    professional_tax: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
}, { _id: false });

const bankDetailsSchema = new mongoose.Schema({
    account_number: { type: String, default: '' },
    bank_name: { type: String, default: '' },
    ifsc_code: { type: String, default: '' },
    upi_id: { type: String, default: '' }
}, { _id: false });

const salaryHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    monthly_salary: { type: Number, required: true },
    allowances: allowanceSchema,
    deductions: deductionSchema,
    changed_by: { type: String, default: 'Admin' }
}, { _id: false });

const salarySetupSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
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
    department: {
        type: String,
        default: 'General'
    },
    monthly_salary: {
        type: Number,
        required: true
    },
    per_day_salary: {
        type: Number,
        required: true
    },
    allowances: allowanceSchema,
    deductions: deductionSchema,
    bank_details: bankDetailsSchema,
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    history: [salaryHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('SalarySetup', salarySetupSchema);
