const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true,
        default: '',
    },
    email: {
        type: String,
        required: false, // Not all users have email (e.g. Parents might only have phone)
        unique: true,
        sparse: true,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Staff', 'Parent', 'Driver'],
        required: true,
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        refPath: 'roleModel'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Blocked'],
        default: 'Active',
    },
    last_login_at: {
        type: Date,
        default: null,
    },
    refresh_tokens: [{
        type: String,
    }],
    reset_password_token: {
        type: String,
        default: null,
    },
    reset_password_expire: {
        type: Date,
        default: null,
    }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
