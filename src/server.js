// src/server.js
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { init: initSocket } = require('./socket/socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 HR Antbox Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`📁 API Docs: http://localhost:${PORT}/api/v1/health`);
});

server.on('error', (err) => {
  logger.error('Server error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});
