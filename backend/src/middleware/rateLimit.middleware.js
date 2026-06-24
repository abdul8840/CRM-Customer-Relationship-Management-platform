const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const Redis = require('ioredis');
const logger = require('../config/logger');

let store;
if (process.env.REDIS_URL) {
  const client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: false });
  client.on('error', (e) => logger.warn(`Redis error: ${e.message}`));
  store = new RedisStore({ sendCommand: (...args) => client.call(...args), prefix: 'rl:' });
  logger.info('🔴 Rate limiter using Redis');
} else {
  logger.info('🟡 Rate limiter using in-memory store (single instance only)');
}

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false,
  store,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  store,
  message: { success: false, message: 'Too many auth attempts, please try again later' },
});

module.exports = { apiLimiter, authLimiter };