// src/routes/employee.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/employee.controller');
const { authenticate, authorize, authorizeOrSelf } = require('../middleware/auth');

router.use(authenticate);

router.get('/stats', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getStats);
router.get('/', authorize('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getAll);
router.get('/:id', authorizeOrSelf('SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'), ctrl.getOne);
router.post('/', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.create);
router.put('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.update);
router.delete('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.remove);

module.exports = router;
