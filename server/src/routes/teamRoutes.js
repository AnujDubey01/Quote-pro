const express = require('express');
const { getTeam, addTeamMember, updateMemberStatus, updateMemberRole } = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const { requireTenant } = require('../middlewares/tenantMiddleware');
const { authorize } = require('../middlewares/rbacMiddleware');

const router = express.Router();

router.use(protect);
router.use(requireTenant);

router.get('/', authorize('team.read'), getTeam);
router.post('/', authorize('team.manage'), addTeamMember);
router.patch('/:id/status', authorize('team.manage'), updateMemberStatus);
router.patch('/:id/role', authorize('team.manage'), updateMemberRole);

module.exports = router;
