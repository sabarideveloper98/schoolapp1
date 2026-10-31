const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true
    },
    contact_number: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    logo: {
        type: String, // Cloudinary URL
        required: false
    },
    founder_name: {
        type: String,
        required: true
    },
    founder_phone: {
        type: String,
        required: true
    },
    founder_email: {
        type: String,
        required: true
    },
    admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    code: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        unique: true
    },
    school_id: {
        type: String,
        trim: true,
        uppercase: true,
        sparse: true,
        unique: true
    },
    db_name: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
    },
    provisioning_status: {
        type: String,
        enum: ['pending', 'provisioning', 'ready', 'failed'],
        default: 'ready'
    },
    address: {
        type: String,
        trim: true
    }
}, { timestamps: true });

const School = mongoose.model('School', schoolSchema);
module.exports = School;
