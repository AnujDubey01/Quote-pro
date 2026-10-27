const express = require('express');
const { getCompany, updateCompany } = require('../controllers/companyController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTenant } = require('../middlewares/tenantMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.get('/', authorize('company.read'), getCompany);
router.patch('/', authorize('company.manage'), updateCompany);

module.exports = router;
