require('dotenv').config();
const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const { connectDB } = require('./config/database');
const socket = require('./services/socket.service');
const jobs = require('./jobs');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    const httpServer = http.createServer(app);
    socket.init(httpServer);
    jobs.start();

    httpServer.listen(PORT, () => logger.info(`🚀 Server: http://localhost:${PORT}${process.env.API_PREFIX}`));

    const shutdown = (sig) => { logger.info(`${sig} received`); httpServer.close(() => process.exit(0)); };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (e) => { logger.error(e); shutdown('unhandledRejection'); });
  } catch (err) { logger.error(err); process.exit(1); }
})();