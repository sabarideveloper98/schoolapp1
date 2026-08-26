const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
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
        enum: ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Staff', 'Parent'],
        required: true,
    },
    reference_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: false, // SuperAdmin doesn't have a profile reference
        refPath: 'roleModel' // Dynamically reference based on role (Teacher, Staff, Parent) - Optional, we can just store the ID
    },
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
