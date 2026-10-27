const express = require('express');
const {
    createQuotation,
    getQuotations,
    getQuotation,
    reviseQuotation,
    approveQuotation,
    rejectQuotation,
    updateQuotationStatus,
    generatePDF,
    emailQuotation
} = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTenant } = require('../middlewares/tenantMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.post('/', authorize('quotation.create'), createQuotation);
router.get('/', authorize('quotation.read'), getQuotations);
router.get('/:id', authorize('quotation.read'), getQuotation);
router.post('/:id/revise', authorize('quotation.create'), reviseQuotation);
router.post('/:id/approve', authorize('quotation.approve'), approveQuotation);
router.post('/:id/reject', authorize('quotation.reject'), rejectQuotation);
router.patch('/:id/status', authorize('quotation.create'), updateQuotationStatus);
router.get('/:id/pdf', authorize('quotation.generate_pdf'), generatePDF);
router.post('/:id/email', authorize('quotation.generate_pdf'), emailQuotation);

module.exports = router;
