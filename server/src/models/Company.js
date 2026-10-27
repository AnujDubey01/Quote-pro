const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    logo: {
        type: String,
        default: null,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    address: {
        type: String,
        trim: true,
    },
    settings: {
        type: Object,
        default: {},
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'inactive'],
        default: 'active',
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Company', companySchema);
