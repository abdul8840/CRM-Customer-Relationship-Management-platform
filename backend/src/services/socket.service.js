const { Server } = require('socket.io');
const { verifyAccess } = require('../utils/jwt');
const logger = require('../config/logger');

let io;
const userSockets = new Map(); // userId -> Set<socketId>

const init = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean), credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Auth required'));
      socket.user = verifyAccess(token);
      next();
    } catch { next(new Error('Invalid token')); }
  });

  io.on('connection', (socket) => {
    const uid = socket.user.id;
    if (!userSockets.has(uid)) userSockets.set(uid, new Set());
    userSockets.get(uid).add(socket.id);
    socket.join(`user:${uid}`);
    logger.info(`Socket connected: user ${uid}`);

    socket.on('disconnect', () => {
      userSockets.get(uid)?.delete(socket.id);
      if (userSockets.get(uid)?.size === 0) userSockets.delete(uid);
    });
  });
};

const emitToUser = (userId, event, data) => io?.to(`user:${userId}`).emit(event, data);
const emitToAll = (event, data) => io?.emit(event, data);

const close = () => new Promise((resolve) => {
  if (!io) return resolve();
  io.disconnectSockets(true);
  io.close(() => resolve());
});

module.exports = { init, emitToUser, emitToAll, close };