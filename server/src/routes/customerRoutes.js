const express = require('express');
const { createCustomer, getCustomers, updateCustomer, deleteCustomer } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTenant } = require('../middlewares/tenantMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.post('/', authorize('customer.create'), createCustomer);
router.get('/', authorize('customer.read'), getCustomers);
router.patch('/:id', authorize('customer.update'), updateCustomer);
router.delete('/:id', authorize('customer.delete'), deleteCustomer);

module.exports = router;
