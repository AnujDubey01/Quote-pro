const Quotation = require('../models/Quotation');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Company = require('../models/Company');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateQuotationPDF } = require('../services/pdfService');
const { sendQuotationEmail, sendApprovalRequiredAlert, sendQuotationDecisionAlert } = require('../services/emailService');

// Helper to calculate totals to ensure backend integrity
const calculateTotals = (items) => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    const validatedItems = (items || []).map(item => {
        const unitPrice = Number(item.unitPrice) || 0;
        const quantity = Number(item.quantity) || 1;
        const discount = Number(item.discount) || 0;
        const tax = Number(item.tax) || 0;
        const itemTotal = (unitPrice * quantity) - discount + tax;
        subtotal += (unitPrice * quantity);
        totalTax += tax;
        totalDiscount += discount;

        return {
            ...item,
            unitPrice,
            quantity,
            discount,
            tax,
            total: itemTotal
        };
    });

    const total = subtotal - totalDiscount + totalTax;

    return { validatedItems, subtotal, totalTax, totalDiscount, total };
};

// @desc    Create a new quotation
// @route   POST /api/v1/quotations
// @access  Private
const createQuotation = async (req, res) => {
    try {
        const { customerId, items, notes, terms, quotationNumber, originalQuotationId, revision, revisionNotes } = req.body;
        const companyId = req.tenantId;

        // Fetch customer for snapshot
        const customer = await Customer.findOne({ _id: customerId, companyId });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        const customerSnapshot = {
            name: customer.name,
            companyName: customer.companyName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            gstNumber: customer.gstNumber,
        };

        // Recalculate totals
        const { validatedItems, subtotal, totalTax, totalDiscount, total } = calculateTotals(items);

        // Fetch company settings to evaluate discount and price thresholds
        const company = await Company.findById(companyId);
        const maxDiscount = company?.settings?.maxDiscountThreshold !== undefined ? Number(company.settings.maxDiscountThreshold) : 10;
        const maxPrice = company?.settings?.approvalPriceThreshold !== undefined ? Number(company.settings.approvalPriceThreshold) : 100000;
        const discountPct = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

        // Check if user has approval authority
        const userRole = req.user.roleId?.name || req.user.role || '';
        const roleLower = userRole.toLowerCase();
        const canSelfApprove = roleLower.includes('admin') || roleLower.includes('manager') || roleLower.includes('owner') || req.user.roleId?.permissions?.includes('*') || req.user.roleId?.permissions?.includes('quotation.approve');

        let initialStatus = 'approved';
        let approvalMessage = 'Quotation created and approved for client delivery';

        if (!canSelfApprove) {
            const discountExceeded = discountPct > maxDiscount;
            const priceExceeded = total > maxPrice;

            if (discountExceeded && priceExceeded) {
                initialStatus = 'pending';
                approvalMessage = `Quotation flagged for Manager Approval: total ₹${total.toLocaleString('en-IN')} exceeds auto-approval ceiling of ₹${maxPrice.toLocaleString('en-IN')} and discount ${discountPct.toFixed(1)}% exceeds ${maxDiscount}% limit`;
            } else if (priceExceeded) {
                initialStatus = 'pending';
                approvalMessage = `Quotation flagged for Manager Approval: total ₹${total.toLocaleString('en-IN')} exceeds auto-approval ceiling of ₹${maxPrice.toLocaleString('en-IN')}`;
            } else if (discountExceeded) {
                initialStatus = 'pending';
                approvalMessage = `Quotation flagged for Manager Approval: discount ${discountPct.toFixed(1)}% exceeds policy ceiling of ${maxDiscount}%`;
            }
        }

        let finalQuotationNumber = quotationNumber;
        if (!finalQuotationNumber) {
            const count = await Quotation.countDocuments({ companyId });
            finalQuotationNumber = `QTN-${String(count + 1).padStart(4, '0')}`;
        }

        const quotation = await Quotation.create({
            companyId,
            quotationNumber: finalQuotationNumber,
            customerId,
            customerSnapshot,
            items: validatedItems,
            subtotal,
            tax: totalTax,
            discount: totalDiscount,
            total,
            notes,
            terms: terms || company?.settings?.pdfTerms,
            revision: revision ? Number(revision) : 0,
            originalQuotationId: originalQuotationId || null,
            revisionNotes: revisionNotes || null,
            createdBy: req.user._id,
            status: initialStatus,
        });

        const populated = await Quotation.findById(quotation._id)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('originalQuotationId', 'quotationNumber revision status total');

        // Asynchronously dispatch approval alert to managers if quotation breached ceilings
        if (initialStatus === 'pending') {
            (async () => {
                try {
                    const managerRoles = await Role.find({ companyId, name: { $in: ['Manager', 'Owner', 'Admin'] } });
                    const roleIds = managerRoles.map(r => r._id);
                    const managers = await User.find({ companyId, roleId: { $in: roleIds } }).select('name email');
                    for (const m of managers) {
                        if (m.email) {
                            await sendApprovalRequiredAlert({
                                managerEmail: m.email,
                                managerName: m.name,
                                quotation: populated,
                                salesRepName: req.user.name,
                                company,
                                discountPercent: discountPct
                            });
                        }
                    }
                } catch (emailErr) {
                    console.warn('Background manager approval alert failed:', emailErr.message);
                }
            })();
        }

        res.status(201).json({
            success: true,
            requiresApproval: initialStatus === 'pending',
            message: approvalMessage,
            data: populated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all quotations
// @route   GET /api/v1/quotations
// @access  Private
const getQuotations = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const startIndex = (page - 1) * limit;

        const query = { companyId };
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Strict RBAC: Sales representatives strictly see their own proposals
        const userRoleName = (req.user?.roleId?.name || '').toLowerCase();
        const isSalesOnly = userRoleName.includes('sales') && !userRoleName.includes('owner') && !userRoleName.includes('manager') && !req.user?.isSuperAdmin;

        if (isSalesOnly || req.query.myQuotes === 'true') {
            query.createdBy = req.user._id;
        }

        const total = await Quotation.countDocuments(query);
        const quotations = await Quotation.find(query)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('originalQuotationId', 'quotationNumber revision status total')
            .skip(startIndex)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: quotations.length,
            pagination: { page, limit, total },
            data: quotations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get a single quotation
// @route   GET /api/v1/quotations/:id
// @access  Private
const getQuotation = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.tenantId };
        const userRoleName = (req.user?.roleId?.name || '').toLowerCase();
        const isSalesOnly = userRoleName.includes('sales') && !userRoleName.includes('owner') && !userRoleName.includes('manager') && !req.user?.isSuperAdmin;
        if (isSalesOnly) {
            query.createdBy = req.user._id;
        }

        const quotation = await Quotation.findOne(query)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('originalQuotationId', 'quotationNumber revision status total');

        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Create a revision of an existing quotation
// @route   POST /api/v1/quotations/:id/revise
// @access  Private
const reviseQuotation = async (req, res) => {
    try {
        const companyId = req.tenantId;
        const original = await Quotation.findOne({ _id: req.params.id, companyId });

        if (!original) {
            return res.status(404).json({ success: false, message: 'Source quotation not found' });
        }

        // Extract base quotation number (strip existing -R\d+ suffix)
        const baseNumber = original.quotationNumber.replace(/-R\d+$/i, '');

        // Find existing revisions with same base number for this company
        const escapedBase = baseNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingRevisions = await Quotation.find({
            companyId,
            quotationNumber: { $regex: new RegExp(`^${escapedBase}(-R\\d+)?$`, 'i') }
        }).select('quotationNumber revision');

        let maxRev = original.revision || 0;
        existingRevisions.forEach(q => {
            if (q.revision && q.revision > maxRev) maxRev = q.revision;
            const match = q.quotationNumber.match(/-R(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxRev) maxRev = num;
            }
        });

        const nextRev = maxRev + 1;
        const newQuotationNumber = `${baseNumber}-R${nextRev}`;

        // Customer selection (supports empty body revisions)
        const body = req.body || {};
        const customerId = body.customerId || original.customerId;
        const itemsToUse = (body.items && body.items.length > 0) ? body.items : original.items;
        const notes = body.notes !== undefined ? body.notes : original.notes;
        const terms = body.terms !== undefined ? body.terms : original.terms;
        const revisionNotes = body.revisionNotes || `Revision ${nextRev} derived from ${original.quotationNumber}`;

        // Fetch customer snapshot
        const customer = await Customer.findOne({ _id: customerId, companyId });
        const customerSnapshot = customer ? {
            name: customer.name,
            companyName: customer.companyName,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            gstNumber: customer.gstNumber,
        } : original.customerSnapshot;

        // Calculate totals
        const { validatedItems, subtotal, totalTax, totalDiscount, total } = calculateTotals(itemsToUse);

        // Fetch company settings to evaluate discount and price thresholds
        const company = await Company.findById(companyId);
        const maxDiscount = company?.settings?.maxDiscountThreshold !== undefined ? Number(company.settings.maxDiscountThreshold) : 10;
        const maxPrice = company?.settings?.approvalPriceThreshold !== undefined ? Number(company.settings.approvalPriceThreshold) : 100000;
        const discountPct = subtotal > 0 ? (totalDiscount / subtotal) * 100 : 0;

        const userRole = req.user.roleId?.name || '';
        const canSelfApprove = userRole.includes('Admin') || userRole.includes('Manager') || userRole.includes('Owner') || req.user.roleId?.permissions?.includes('*') || req.user.roleId?.permissions?.includes('quotation.approve');

        let initialStatus = 'approved';
        let approvalMessage = `Created Revision ${newQuotationNumber} (approved for delivery)`;

        if (!canSelfApprove) {
            const discountExceeded = discountPct > maxDiscount;
            const priceExceeded = total > maxPrice;

            if (discountExceeded && priceExceeded) {
                initialStatus = 'pending';
                approvalMessage = `Revision ${newQuotationNumber} flagged for Manager Approval: total ₹${total.toLocaleString('en-IN')} exceeds ₹${maxPrice.toLocaleString('en-IN')} and discount ${discountPct.toFixed(1)}% exceeds ${maxDiscount}%`;
            } else if (priceExceeded) {
                initialStatus = 'pending';
                approvalMessage = `Revision ${newQuotationNumber} flagged for Manager Approval: total ₹${total.toLocaleString('en-IN')} exceeds ₹${maxPrice.toLocaleString('en-IN')} ceiling`;
            } else if (discountExceeded) {
                initialStatus = 'pending';
                approvalMessage = `Revision ${newQuotationNumber} flagged for Manager Approval: discount ${discountPct.toFixed(1)}% exceeds policy ceiling of ${maxDiscount}%`;
            }
        }

        const newQuotation = await Quotation.create({
            companyId,
            quotationNumber: newQuotationNumber,
            customerId,
            customerSnapshot,
            items: validatedItems,
            subtotal,
            tax: totalTax,
            discount: totalDiscount,
            total,
            notes,
            terms: terms || company?.settings?.pdfTerms,
            status: initialStatus,
            revision: nextRev,
            originalQuotationId: original._id,
            revisionNotes,
            createdBy: req.user._id,
            approvedBy: canSelfApprove ? req.user._id : null
        });

        const populated = await Quotation.findById(newQuotation._id)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email')
            .populate('originalQuotationId', 'quotationNumber revision status total');

        res.status(201).json({
            success: true,
            requiresApproval: initialStatus === 'pending',
            message: approvalMessage,
            data: populated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Approve quotation
// @route   POST /api/v1/quotations/:id/approve
// @access  Private (Manager & Admin only)
const approveQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.tenantId });

        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        quotation.status = 'approved';
        quotation.approvedBy = req.user._id;

        await quotation.save();

        const updated = await Quotation.findById(quotation._id)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');

        // Asynchronously notify sales representative of approval
        if (updated.createdBy?.email) {
            (async () => {
                try {
                    const company = await Company.findById(req.tenantId);
                    await sendQuotationDecisionAlert({
                        salesRepEmail: updated.createdBy.email,
                        salesRepName: updated.createdBy.name,
                        quotation: updated,
                        decision: 'approved',
                        managerName: req.user.name,
                        company
                    });
                } catch (emailErr) {
                    console.warn('Background sales approval alert failed:', emailErr.message);
                }
            })();
        }

        res.status(200).json({ success: true, message: 'Quotation approved successfully', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Reject quotation
// @route   POST /api/v1/quotations/:id/reject
// @access  Private (Manager & Admin only)
const rejectQuotation = async (req, res) => {
    try {
        const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.tenantId });

        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        quotation.status = 'rejected';
        if (req.body.reason) {
            quotation.notes = quotation.notes
                ? `${quotation.notes} [Rejected: ${req.body.reason}]`
                : `[Rejected: ${req.body.reason}]`;
        }

        await quotation.save();

        const updated = await Quotation.findById(quotation._id)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');

        // Asynchronously notify sales representative of rejection
        if (updated.createdBy?.email) {
            (async () => {
                try {
                    const company = await Company.findById(req.tenantId);
                    await sendQuotationDecisionAlert({
                        salesRepEmail: updated.createdBy.email,
                        salesRepName: updated.createdBy.name,
                        quotation: updated,
                        decision: 'rejected',
                        remarks: req.body.reason || '',
                        managerName: req.user.name,
                        company
                    });
                } catch (emailErr) {
                    console.warn('Background sales rejection alert failed:', emailErr.message);
                }
            })();
        }

        res.status(200).json({ success: true, message: 'Quotation rejected', data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update quotation CRM lifecycle status
// @route   PATCH /api/v1/quotations/:id/status
// @access  Private
const updateQuotationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'sent', 'won', 'lost'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const quotation = await Quotation.findOne({ _id: req.params.id, companyId: req.tenantId });
        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        quotation.status = status;
        await quotation.save();

        res.status(200).json({ success: true, message: `Status updated to ${status}`, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Generate PDF for quotation
// @route   GET /api/v1/quotations/:id/pdf
// @access  Private
const generatePDF = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.tenantId };
        const userRoleName = (req.user?.roleId?.name || '').toLowerCase();
        const isSalesOnly = userRoleName.includes('sales') && !userRoleName.includes('owner') && !userRoleName.includes('manager') && !req.user?.isSuperAdmin;
        if (isSalesOnly) {
            query.createdBy = req.user._id;
        }

        const quotation = await Quotation.findOne(query)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');

        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        const company = await Company.findById(req.tenantId);

        const pdfBuffer = await generateQuotationPDF(quotation, company);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="quotation-${quotation.quotationNumber}.pdf"`
        });
        
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate PDF', error: error.message });
    }
};

// @desc    Email quotation directly to client with PDF attachment
// @route   POST /api/v1/quotations/:id/email
// @access  Private
const emailQuotation = async (req, res) => {
    try {
        const query = { _id: req.params.id, companyId: req.tenantId };
        const userRoleName = (req.user?.roleId?.name || '').toLowerCase();
        const isSalesOnly = userRoleName.includes('sales') && !userRoleName.includes('owner') && !userRoleName.includes('manager') && !req.user?.isSuperAdmin;
        if (isSalesOnly) {
            query.createdBy = req.user._id;
        }

        const quotation = await Quotation.findOne(query)
            .populate('createdBy', 'name email')
            .populate('approvedBy', 'name email');

        if (!quotation) {
            return res.status(404).json({ success: false, message: 'Quotation not found' });
        }

        if (quotation.status === 'pending') {
            return res.status(400).json({
                success: false,
                message: 'This quotation is pending manager review and cannot be sent to clients yet.'
            });
        }

        const clientEmail = req.body.recipientEmail || quotation.customerSnapshot?.email;
        if (!clientEmail) {
            return res.status(400).json({ success: false, message: 'Recipient email address is required' });
        }

        const company = await Company.findById(req.tenantId);
        const pdfBuffer = await generateQuotationPDF(quotation, company);

        const emailResult = await sendQuotationEmail({
            to: clientEmail,
            customerName: quotation.customerSnapshot?.name || 'Valued Client',
            quotation,
            company,
            pdfBuffer
        });

        // Update status to 'sent' if it was 'approved'
        if (quotation.status === 'approved') {
            quotation.status = 'sent';
            await quotation.save();
        }

        res.status(200).json({
            success: true,
            message: `Quotation #${quotation.quotationNumber} emailed successfully to ${clientEmail}`,
            data: {
                emailId: emailResult?.id,
                recipient: clientEmail,
                quotationNumber: quotation.quotationNumber,
                status: quotation.status
            }
        });
    } catch (error) {
        console.error('Email quotation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to email quotation' });
    }
};

module.exports = {
    createQuotation,
    getQuotations,
    getQuotation,
    reviseQuotation,
    approveQuotation,
    rejectQuotation,
    updateQuotationStatus,
    generatePDF,
    emailQuotation
};
