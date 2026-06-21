const { Op } = require('sequelize');
const { User, Role, RefreshToken, Otp, LoginHistory } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { signAccess, signRefresh, verifyRefresh, randomToken } = require('../../utils/jwt');
const { generateOtp } = require('../../utils/otp');
const { ROLES, OTP_PURPOSE } = require('../../config/constants');

class AuthService {
  async register({ first_name, last_name, email, phone, password }) {
    const exists = await User.findOne({ where: { email } });
    if (exists) throw new ApiError(409, 'Email already registered');

    const role = await Role.findOne({ where: { slug: ROLES.CUSTOMER } });
    if (!role) throw new ApiError(500, 'Default role missing. Run seeders.');

    const user = await User.create({
      first_name, last_name, email, phone, password,
      role_id: role.id, status: 'pending',
    });

    const otp = await this.#createOtp(user.id, email, OTP_PURPOSE.EMAIL_VERIFY);
    return { user, otp: otp.code }; // otp.code returned for dev; in prod only emailed
  }

  async verifyEmail({ email, code }) {
    const otp = await this.#consumeOtp(email, code, OTP_PURPOSE.EMAIL_VERIFY);
    const user = await User.findOne({ where: { email } });
    if (!user) throw new ApiError(404, 'User not found');

    user.email_verified_at = new Date();
    user.status = 'active';
    await user.save();
    return user;
  }

  async resendOtp({ email, purpose }) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new ApiError(404, 'User not found');
    const otp = await this.#createOtp(user.id, email, purpose);
    return otp.code;
  }

  async login({ email, password }, meta = {}) {
    const user = await User.scope('withPassword').findOne({
      where: { email }, include: [{ model: Role, as: 'role' }],
    });
    if (!user) { await this.#logLogin(null, meta, 'failed', 'user_not_found'); throw new ApiError(401, 'Invalid credentials'); }
    if (user.status === 'pending') throw new ApiError(403, 'Please verify your email first');
    if (user.status !== 'active') throw new ApiError(403, `Account is ${user.status}`);

    const ok = await user.comparePassword(password);
    if (!ok) { await this.#logLogin(user.id, meta, 'failed', 'wrong_password'); throw new ApiError(401, 'Invalid credentials'); }

    user.last_login_at = new Date();
    await user.save();
    await this.#logLogin(user.id, meta, 'success');

    return this.#issueTokens(user, meta);
  }

  async refresh({ refresh_token }, meta = {}) {
    let payload;
    try { payload = verifyRefresh(refresh_token); }
    catch { throw new ApiError(401, 'Invalid refresh token'); }

    const stored = await RefreshToken.findOne({ where: { token: refresh_token, user_id: payload.id } });
    if (!stored || stored.revoked_at || stored.expires_at < new Date())
      throw new ApiError(401, 'Refresh token expired or revoked');

    const user = await User.findByPk(payload.id, { include: [{ model: Role, as: 'role' }] });
    if (!user || user.status !== 'active') throw new ApiError(401, 'User unavailable');

    stored.revoked_at = new Date();
    await stored.save();
    return this.#issueTokens(user, meta);
  }

  async logout({ refresh_token, userId }) {
    await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { user_id: userId, ...(refresh_token && { token: refresh_token }) } }
    );
  }

  async forgotPassword({ email }) {
    const user = await User.findOne({ where: { email } });
    if (!user) return null; // do not leak existence
    const otp = await this.#createOtp(user.id, email, OTP_PURPOSE.PASSWORD_RESET);
    return otp.code;
  }

  async resetPassword({ email, code, password }) {
    await this.#consumeOtp(email, code, OTP_PURPOSE.PASSWORD_RESET);
    const user = await User.scope('withPassword').findOne({ where: { email } });
    if (!user) throw new ApiError(404, 'User not found');
    user.password = password;
    await user.save();
    await RefreshToken.update({ revoked_at: new Date() }, { where: { user_id: user.id, revoked_at: null } });
    return true;
  }

  async me(userId) {
    return User.findByPk(userId, { include: [{ model: Role, as: 'role' }] });
  }

  // ===== private =====
  async #issueTokens(user, meta) {
    const payload = { id: user.id, uuid: user.uuid, role: user.role?.slug };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ id: user.id, jti: randomToken().slice(0, 16) });
    const decoded = verifyRefresh(refreshToken);

    await RefreshToken.create({
      user_id: user.id, token: refreshToken,
      expires_at: new Date(decoded.exp * 1000),
      ip_address: meta.ip, user_agent: meta.userAgent,
    });

    return { user, accessToken, refreshToken };
  }

  async #createOtp(userId, email, purpose) {
    await Otp.update({ consumed_at: new Date() }, {
      where: { email, purpose, consumed_at: null },
    });
    const minutes = +process.env.OTP_EXPIRES_MIN || 10;
    return Otp.create({
      user_id: userId, email, purpose,
      code: generateOtp(6),
      expires_at: new Date(Date.now() + minutes * 60 * 1000),
    });
  }

  async #consumeOtp(email, code, purpose) {
    const otp = await Otp.findOne({
      where: { email, purpose, consumed_at: null, expires_at: { [Op.gt]: new Date() } },
      order: [['created_at', 'DESC']],
    });
    if (!otp) throw new ApiError(400, 'OTP expired or invalid');
    if (otp.attempts >= 5) throw new ApiError(429, 'Too many attempts');
    if (otp.code !== code) {
      otp.attempts += 1; await otp.save();
      throw new ApiError(400, 'Incorrect OTP');
    }
    otp.consumed_at = new Date(); await otp.save();
    return otp;
  }

  async #logLogin(userId, meta, status, reason) {
    if (!userId) return;
    await LoginHistory.create({
      user_id: userId, ip_address: meta.ip, user_agent: meta.userAgent, status, reason,
    });
  }
}

module.exports = new AuthService();