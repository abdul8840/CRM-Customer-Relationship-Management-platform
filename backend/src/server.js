require('dotenv').config();
const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const { connectDB, sequelize } = require('./config/database');
const socket = require('./services/socket.service');
const jobs = require('./jobs');

const PORT = process.env.PORT || 5000;
let server;

const shutdown = async (signal) => {
  logger.info(`${signal} received — graceful shutdown starting`);
  try {
    if (server) await new Promise((r) => server.close(r));
    await socket.close();
    await sequelize.close();
    logger.info('✅ Shutdown complete');
    process.exit(0);
  } catch (e) { logger.error(`Shutdown error: ${e.message}`); process.exit(1); }
};

(async () => {
  try {
    await connectDB();
    server = http.createServer(app);
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 70_000;
    socket.init(server);
    jobs.start();
    server.listen(PORT, () => logger.info(`🚀 Server: http://localhost:${PORT}${process.env.API_PREFIX}`));

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (e) => { logger.error(e); shutdown('unhandledRejection'); });
    process.on('uncaughtException', (e) => { logger.error(e); shutdown('uncaughtException'); });
  } catch (err) { logger.error(err); process.exit(1); }
})();