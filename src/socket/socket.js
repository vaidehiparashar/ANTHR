// src/socket/socket.js
const { Server } = require('socket.io');
let io;

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    const { employeeId } = socket.handshake.query;
    if (employeeId) {
      socket.join(`employee_${employeeId}`);
    }
    socket.on('join_room', (room) => socket.join(room));
    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { init, getIO };
