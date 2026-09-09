const mongoose = require('mongoose');

const subscriptionConfigSchema = new mongoose.Schema({
    rate_1_year: {
        type: Number,
        default: 50,
        required: true
    },
    rate_2_years: {
        type: Number,
        default: 45,
        required: true
    },
    rate_3_years: {
        type: Number,
        default: 40,
        required: true
    },
    rate_5_years: {
        type: Number,
        default: 30,
        required: true
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const SubscriptionConfig = mongoose.model('SubscriptionConfig', subscriptionConfigSchema);
module.exports = SubscriptionConfig;
