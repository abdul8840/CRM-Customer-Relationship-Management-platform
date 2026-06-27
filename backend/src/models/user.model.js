const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    uuid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, unique: true },
    first_name: { type: DataTypes.STRING(100), allowNull: false },
    last_name: DataTypes.STRING(100),
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    phone: DataTypes.STRING(20),
    password: { type: DataTypes.STRING(255), allowNull: false },
    avatar_url: DataTypes.STRING(500),
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'), defaultValue: 'pending' },
    email_verified_at: DataTypes.DATE,
    last_login_at: DataTypes.DATE,
    created_by: DataTypes.INTEGER,
  }, {
    tableName: 'users',
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: { attributes: { include: ['password'] } } },
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) user.password = await bcrypt.hash(user.password, +process.env.BCRYPT_ROUNDS || 12);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) user.password = await bcrypt.hash(user.password, +process.env.BCRYPT_ROUNDS || 12);
      },
    },
  });

  User.prototype.comparePassword = function (plain) { return bcrypt.compare(plain, this.password); };
  User.prototype.toJSON = function () { const v = { ...this.get() }; delete v.password; return v; };
  return User;
};