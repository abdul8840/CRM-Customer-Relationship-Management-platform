const { sequelize } = require('../config/database');
const Role = require('./role.model')(sequelize);
const Permission = require('./permission.model')(sequelize);
const User = require('./user.model')(sequelize);
const RefreshToken = require('./refreshToken.model')(sequelize);
const Otp = require('./otp.model')(sequelize);
const LoginHistory = require('./loginHistory.model')(sequelize);
const AuditLog = require('./auditLog.model')(sequelize);

// Associations
Role.belongsToMany(Permission, { through: 'role_permissions', foreignKey: 'role_id', otherKey: 'permission_id', as: 'permissions' });
Permission.belongsToMany(Role, { through: 'role_permissions', foreignKey: 'permission_id', otherKey: 'role_id', as: 'roles' });

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Otp, { foreignKey: 'user_id', as: 'otps', onDelete: 'CASCADE' });
Otp.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(LoginHistory, { foreignKey: 'user_id', as: 'loginHistory' });
LoginHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, Role, Permission, User, RefreshToken, Otp, LoginHistory, AuditLog };