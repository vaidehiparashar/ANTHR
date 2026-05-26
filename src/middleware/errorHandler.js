// src/middleware/errorHandler.js
const logger = require('../utils/logger');

const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack, url: req.originalUrl, method: req.method });

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({ success: false, message: `A record with this ${field} already exists.`, timestamp: new Date().toISOString() });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found.', timestamp: new Date().toISOString() });
  }
  if (err.code === 'P2003') {
    return res.status(400).json({ success: false, message: 'Invalid reference: related record not found.', timestamp: new Date().toISOString() });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token.', timestamp: new Date().toISOString() });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired.', timestamp: new Date().toISOString() });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message, timestamp: new Date().toISOString() });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  res.status(statusCode).json({ success: false, message, timestamp: new Date().toISOString() });
};

module.exports = { notFound, errorHandler };
