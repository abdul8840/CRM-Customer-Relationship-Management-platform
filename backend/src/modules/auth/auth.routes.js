const router = require('express').Router();
const ctrl = require('./auth.controller');
const v = require('./auth.validation');
const validate = require('../../middleware/validate.middleware');
const { authenticate } = require('../../middleware/auth.middleware');
const { authLimiter } = require('../../middleware/rateLimit.middleware');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication & authorization
 */

router.post('/register', authLimiter, validate(v.register), ctrl.register);
router.post('/verify-email', authLimiter, validate(v.verifyEmail), ctrl.verifyEmail);
router.post('/resend-otp', authLimiter, validate(v.resendOtp), ctrl.resendOtp);
router.post('/login', authLimiter, validate(v.login), ctrl.login);
router.post('/refresh', validate(v.refresh), ctrl.refresh);
router.post('/forgot-password', authLimiter, validate(v.forgotPassword), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(v.resetPassword), ctrl.resetPassword);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;