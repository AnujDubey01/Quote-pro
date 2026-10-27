const express = require('express');
const { createRole, getRoles, updateRole } = require('../controllers/roleController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTenant } = require('../middlewares/tenantMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const router = express.Router();

// All role routes require authentication, a valid tenant, and specific permissions
router.use(protect);
router.use(requireTenant);

router.post('/', authorize('role.manage'), createRole);
router.get('/', authorize('role.read'), getRoles);
router.patch('/:id', authorize('role.manage'), updateRole);

module.exports = router;
