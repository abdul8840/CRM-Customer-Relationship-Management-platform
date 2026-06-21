const ApiError = require('../utils/ApiError');
const { verifyAccess } = require('../utils/jwt');
const { User, Role, Permission } = require('../models');

const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw new ApiError(401, 'Authentication required');

    const decoded = verifyAccess(token);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: 'role', include: [{ model: Permission, as: 'permissions', through: { attributes: [] } }] }],
    });
    if (!user) throw new ApiError(401, 'User no longer exists');
    if (user.status !== 'active') throw new ApiError(403, `Account is ${user.status}`);

    req.user = user;
    req.permissions = user.role?.permissions?.map((p) => p.slug) || [];
    next();
  } catch (err) { next(err); }
};

module.exports = { authenticate };