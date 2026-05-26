require('dotenv').config();

const http = require('http');
const app = require('./app');
const logger = require('./utils/logger');

let initSocket = null;

try {
  const socketModule = require('./socket/socket');

  if (socketModule.init) {
    initSocket = socketModule.init;
  }
} catch (error) {
  console.log('Socket.io module not found. Continuing without sockets.');
}

const PORT = process.env.PORT || 10000;

const server = http.createServer(app);

// Initialize Socket.io safely
if (initSocket) {
  initSocket(server);
}

server.listen(PORT, () => {
  logger.info(`HR Antbox Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV}`);
});

server.on('error', (err) => {
  logger.error('Server error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);

  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');

  server.close(() => {
    logger.info('Server closed.');
    process.exit(0);
  });
});