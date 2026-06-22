const { Notification } = require('../../models');
const socket = require('../../services/socket.service');

module.exports = {
  async create({ userId, type, title, message, data = {} }) {
    const n = await Notification.create({ user_id: userId, type, title, message, data });
    socket.emitToUser(userId, 'notification:new', n);
    return n;
  },
  list: async (user, query = {}) => {
    const where = { user_id: user.id };
    if (query.unread === 'true') where.read_at = null;
    const limit = +query.limit || 20;
    const offset = ((+query.page || 1) - 1) * limit;
    const { rows, count } = await Notification.findAndCountAll({ where, order: [['created_at', 'DESC']], limit, offset });
    return { items: rows, total: count, unread: await Notification.count({ where: { user_id: user.id, read_at: null } }) };
  },
  markRead: async (user, id) => Notification.update({ read_at: new Date() }, { where: { id, user_id: user.id } }),
  markAllRead: async (user) => Notification.update({ read_at: new Date() }, { where: { user_id: user.id, read_at: null } }),
  remove: async (user, id) => Notification.destroy({ where: { id, user_id: user.id } }),
};