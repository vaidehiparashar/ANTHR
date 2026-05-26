// src/controllers/notification.controller.js
const prisma = require('../utils/prisma');
const { successResponse, errorResponse, paginatedResponse, getPagination, buildPaginationMeta } = require('../utils/response');
const { createNotification } = require('../services/notification.service');

const getMyNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { isRead, type } = req.query;
    const where = { recipientId: req.employeeId };
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (type) where.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where, skip, take: limit,
        include: { sender: { include: { user: { select: { firstName: true, lastName: true, avatar: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { recipientId: req.employeeId, isRead: false } }),
    ]);

    return paginatedResponse(res, { notifications, unreadCount }, buildPaginationMeta(total, page, limit), 'Notifications fetched');
  } catch (err) { next(err); }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return errorResponse(res, 'Notification not found.', 404);
    if (notification.recipientId !== req.employeeId) return errorResponse(res, 'Unauthorized.', 403);

    await prisma.notification.update({ where: { id }, data: { isRead: true, readAt: new Date() } });
    return successResponse(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
};

const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { recipientId: req.employeeId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return errorResponse(res, 'Not found.', 404);
    if (notification.recipientId !== req.employeeId) return errorResponse(res, 'Unauthorized.', 403);

    await prisma.notification.delete({ where: { id: req.params.id } });
    return successResponse(res, null, 'Notification deleted');
  } catch (err) { next(err); }
};

const sendAnnouncement = async (req, res, next) => {
  try {
    const { title, content, targetRoles, isPinned, expiresAt } = req.body;

    const announcement = await prisma.announcement.create({
      data: { title, content, authorId: req.employeeId, isPinned: !!isPinned, targetRoles: targetRoles || [], expiresAt: expiresAt ? new Date(expiresAt) : null },
    });

    // Send notifications to all active employees matching target roles
    const where = { status: 'ACTIVE' };
    if (targetRoles?.length) where.user = { role: { in: targetRoles } };

    const employees = await prisma.employee.findMany({ where, select: { id: true } });

    await Promise.all(employees.map(emp =>
      createNotification({
        type: 'ANNOUNCEMENT',
        priority: 'MEDIUM',
        title,
        message: content.slice(0, 200),
        recipientId: emp.id,
        senderId: req.employeeId,
        data: { announcementId: announcement.id },
      })
    ));

    return successResponse(res, announcement, `Announcement sent to ${employees.length} employees`, 201);
  } catch (err) { next(err); }
};

const getAnnouncements = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const where = { isPublished: true, OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] };

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({ where, skip, take: limit, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }] }),
      prisma.announcement.count({ where }),
    ]);

    return paginatedResponse(res, announcements, buildPaginationMeta(total, page, limit), 'Announcements fetched');
  } catch (err) { next(err); }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification, sendAnnouncement, getAnnouncements };
