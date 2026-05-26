// src/routes/attendance.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/clock-in', ctrl.clockIn);
router.post('/clock-out', ctrl.clockOut);
router.get('/today', ctrl.getToday);
router.get('/my', ctrl.getMyAttendance);
router.get('/summary', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getSummary);
router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getAll);
router.post('/manual', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.manualEntry);

module.exports = router;
