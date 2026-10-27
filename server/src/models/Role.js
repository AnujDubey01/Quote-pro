const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: function() {
            // companyId is required unless it's a system role
            return !this.isSystemRole;
        }
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    permissions: [{
        type: String,
    }],
    isSystemRole: {
        type: Boolean,
        default: false,
    }
}, {
    timestamps: true,
});

// Ensure a role name is unique within a company
roleSchema.index({ companyId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
