const mongoose = require('mongoose');

const parentSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    school_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: false
    },
    name: {
        type: String,
        required: true
    },
    father_name: {
        type: String,
        default: ''
    },
    mother_name: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true
    },
    alternate_phone: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    occupation: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Blocked'],
        default: 'Active'
    },
    last_login_at: {
        type: Date,
        default: null
    }
}, { timestamps: true });

const Parent = mongoose.model('Parent', parentSchema);
module.exports = Parent;
