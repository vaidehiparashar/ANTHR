// src/services/notification.service.js
const prisma = require('../utils/prisma');

const createNotification = async ({ type, priority = 'MEDIUM', title, message, senderId, recipientId, data }) => {
  try {
    return await prisma.notification.create({
      data: { type, priority, title, message, senderId: senderId || null, recipientId, data: data || null },
    });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
    return null;
  }
};

module.exports = { createNotification };
