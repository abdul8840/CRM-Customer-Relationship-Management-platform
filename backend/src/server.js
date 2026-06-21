require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => logger.info(`🚀 Server running on http://localhost:${PORT}${process.env.API_PREFIX}`));

    const shutdown = (signal) => {
      logger.info(`${signal} received. Shutting down...`);
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (e) => { logger.error(e); shutdown('unhandledRejection'); });
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
})();