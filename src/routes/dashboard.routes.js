// src/routes/dashboard.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getDashboard);
router.get('/employee', ctrl.getEmployeeDashboard);

module.exports = router;
