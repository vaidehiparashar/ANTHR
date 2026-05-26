// src/middleware/auth.js
const { verifyAccessToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const prisma = require('../utils/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Authentication required. Please provide a valid token.', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return errorResponse(res, 'Token expired. Please refresh your token.', 401);
      }
      return errorResponse(res, 'Invalid token. Please login again.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { employee: { include: { department: true, position: true } } },
    });

    if (!user || !user.isActive) {
      return errorResponse(res, 'User not found or account deactivated.', 401);
    }

    req.user = user;
    req.employeeId = user.employee?.id || null;
    next();
  } catch (err) {
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return errorResponse(res, 'Authentication required.', 401);
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, `Access denied. Required roles: ${roles.join(', ')}`, 403);
    }
    next();
  };
};

const authorizeOrSelf = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return errorResponse(res, 'Authentication required.', 401);
    const isSelf = req.params.employeeId === req.employeeId || req.params.id === req.employeeId;
    if (roles.includes(req.user.role) || isSelf) return next();
    return errorResponse(res, 'Access denied.', 403);
  };
};

module.exports = { authenticate, authorize, authorizeOrSelf };
