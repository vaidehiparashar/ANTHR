// src/routes/payroll.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/payroll.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/my', ctrl.getMyPayroll);
router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getAll);
router.post('/process', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.processPayroll);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.updatePayrollStatus);
router.get('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.getOne);

module.exports = router;
