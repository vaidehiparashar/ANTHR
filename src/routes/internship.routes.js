// src/routes/internship.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/internship.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getAll);
router.get('/my', ctrl.getMy);
router.post('/', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.create);
router.post('/send-mail', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.sendBulkMail);
router.put('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.update);

module.exports = router;
