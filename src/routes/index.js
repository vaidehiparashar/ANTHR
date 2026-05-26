// src/routes/index.js
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/departments', require('./department.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/leaves', require('./leave.routes'));
router.use('/payroll', require('./payroll.routes'));
router.use('/recruitment', require('./recruitment.routes'));
router.use('/internships', require('./internship.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/documents', require('./document.routes'));

module.exports = router;
