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
    }
}, { timestamps: true });

const School = mongoose.model('School', schoolSchema);
module.exports = School;
