const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const { requireSuperAdmin } = require('../middlewares/superAdminMiddleware');
const {
    getPlatformStats,
    getCompanies,
    createCompanyWithAdmin,
    toggleCompanyStatus
} = require('../controllers/platformController');

const router = express.Router();

router.use(protect);
router.use(requireSuperAdmin);

router.get('/stats', getPlatformStats);
router.get('/companies', getCompanies);
router.post('/companies', createCompanyWithAdmin);
router.patch('/companies/:id/status', toggleCompanyStatus);

module.exports = router;
