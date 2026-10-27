const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    description: { type: String },
    unit: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 }
});

const quotationSchema = new mongoose.Schema({
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true,
    },
    quotationNumber: {
        type: String,
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    customerSnapshot: {
        name: { type: String, required: true },
        companyName: { type: String },
        email: { type: String },
        phone: { type: String },
        address: { type: String },
        gstNumber: { type: String },
    },
    items: [quotationItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0,
    },
    tax: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
    },
    total: {
        type: Number,
        required: true,
        min: 0,
    },
    notes: {
        type: String,
    },
    terms: {
        type: String,
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected', 'sent', 'won', 'lost', 'converted'],
        default: 'draft',
    },
    revision: {
        type: Number,
        default: 0,
        min: 0,
    },
    originalQuotationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quotation',
        default: null,
    },
    revisionNotes: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

// Ensure quotation number is unique per company
quotationSchema.index({ companyId: 1, quotationNumber: 1 }, { unique: true });

module.exports = mongoose.model('Quotation', quotationSchema);
