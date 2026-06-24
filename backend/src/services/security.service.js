const { Op } = require('sequelize');
const { LoginHistory, Otp } = require('../models');
const ApiError = require('../utils/ApiError');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_WINDOW_MIN = 15;
const MAX_OTP_REQUESTS = 5;
const OTP_WINDOW_MIN = 60;

module.exports = {
  async assertLoginAllowed(email) {
    const since = new Date(Date.now() - LOCK_WINDOW_MIN * 60 * 1000);
    const failures = await LoginHistory.count({
      include: [{ model: require('../models').User, as: 'user', where: { email }, required: true }],
      where: { status: 'failed', created_at: { [Op.gte]: since } },
    });
    if (failures >= MAX_LOGIN_ATTEMPTS)
      throw new ApiError(429, `Too many failed attempts. Try again in ${LOCK_WINDOW_MIN} minutes.`);
  },

  async assertOtpAllowed(email, purpose) {
    const since = new Date(Date.now() - OTP_WINDOW_MIN * 60 * 1000);
    const count = await Otp.count({ where: { email, purpose, created_at: { [Op.gte]: since } } });
    if (count >= MAX_OTP_REQUESTS)
      throw new ApiError(429, 'Too many OTP requests. Please wait and try again.');
  },
};