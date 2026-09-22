const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    driver_id: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    mobile_number: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: false,
        trim: true
    },
    address: {
        type: String,
        required: false,
        default: ''
    },
    license_number: {
        type: String,
        required: true,
        trim: true
    },
    license_expiry: {
        type: Date,
        required: false
    },
    photo: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    password: {
        type: String,
        required: false
    },
    assigned_bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        default: null
    },
    // OTP Authentication Fields
    otp_code: { type: String, default: null },
    otp_expiry: { type: Date, default: null },
    otp_attempts: { type: Number, default: 0 },
    otp_verified: { type: Boolean, default: false },
    last_otp_sent_at: { type: Date, default: null },
    otp_request_count: { type: Number, default: 0 },
    otp_window_start: { type: Date, default: null },
    lock_until: { type: Date, default: null }
}, { timestamps: true });

// Hash driver password before saving if provided
driverSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to match password
driverSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
