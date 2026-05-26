// src/middleware/audit.js
const prisma = require('../utils/prisma');

const audit = (action, entity) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (body?.success && req.user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            action,
            entity,
            entityId: req.params?.id || body?.data?.id || null,
            newValues: req.body || null,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          },
        });
      } catch (_) { /* non-blocking */ }
    }
    return originalJson(body);
  };
  next();
};

module.exports = { audit };
