// src/routes/notification.routes.js
const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Announcements
router.get('/announcements', ctrl.getAnnouncements);
router.post('/announcements', authorize('SUPER_ADMIN', 'HR_ADMIN'), ctrl.sendAnnouncement);

// Notifications
router.get('/', ctrl.getMyNotifications);
router.patch('/mark-all-read', ctrl.markAllAsRead);
router.patch('/:id/read', ctrl.markAsRead);
router.delete('/:id', ctrl.deleteNotification);

module.exports = router;
