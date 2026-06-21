const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

exports.register = asyncHandler(async (req, res) => {
  const { user, otp } = await authService.register(req.body);
  // TODO (Step 2): send OTP via Brevo
  res.status(201).json(new ApiResponse(201, {
    user, ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  }, 'Registered. Verify your email with the OTP sent.'));
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const user = await authService.verifyEmail(req.body);
  res.json(new ApiResponse(200, { user }, 'Email verified successfully'));
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const otp = await authService.resendOtp(req.body);
  res.json(new ApiResponse(200, process.env.NODE_ENV !== 'production' ? { devOtp: otp } : {}, 'OTP sent'));
});

exports.login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, meta(req));
  res.json(new ApiResponse(200, data, 'Logged in'));
});

exports.refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body, meta(req));
  res.json(new ApiResponse(200, data, 'Token refreshed'));
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout({ refresh_token: req.body.refresh_token, userId: req.user.id });
  res.json(new ApiResponse(200, null, 'Logged out'));
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const otp = await authService.forgotPassword(req.body);
  res.json(new ApiResponse(200,
    process.env.NODE_ENV !== 'production' && otp ? { devOtp: otp } : {},
    'If the email exists, an OTP has been sent'
  ));
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.json(new ApiResponse(200, null, 'Password reset successful'));
});

exports.me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  res.json(new ApiResponse(200, { user }, 'OK'));
});