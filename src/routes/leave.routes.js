// src/routes/leave.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/leave.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/request', ctrl.requestLeave);
router.get('/my', ctrl.getMyLeaves);
router.get('/balances/:employeeId?', ctrl.getBalances);
router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getAll);
router.post('/process-monthly', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.processMonthlyLeaves);
router.post('/send-mail', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.sendBulkMail);
router.patch('/:id/action', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.approveLeave);
router.patch('/:id/cancel', ctrl.cancelLeave);

module.exports = router;
