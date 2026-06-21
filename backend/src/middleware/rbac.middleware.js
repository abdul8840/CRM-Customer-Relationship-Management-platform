const ApiError = require('../utils/ApiError');

const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authenticated'));
  if (!allowedRoles.includes(req.user.role?.slug))
    return next(new ApiError(403, 'You do not have permission to access this resource'));
  next();
};

const hasPermission = (...required) => (req, _res, next) => {
  if (!req.user) return next(new ApiError(401, 'Not authenticated'));
  const ok = required.every((p) => req.permissions.includes(p));
  if (!ok) return next(new ApiError(403, 'Insufficient permissions'));
  next();
};

module.exports = { authorize, hasPermission };