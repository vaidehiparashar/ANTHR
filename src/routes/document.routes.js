// src/routes/document.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/document.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);

router.get('/:employeeId', ctrl.getDocuments);
router.post('/:employeeId', upload.single('file'), ctrl.uploadDocument);
router.delete('/:id', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.deleteDocument);

module.exports = router;
