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
        required: true
    },
    assigned_bus_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        default: null
    }
}, { timestamps: true });

// Hash driver password before saving
driverSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to match password
driverSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
