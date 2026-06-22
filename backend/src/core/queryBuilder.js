const { Op } = require('sequelize');

module.exports = (query = {}, { searchFields = [], allowedFilters = [], defaultSort = '-created_at' } = {}) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;

  const where = {};

  // Search across multiple fields
  if (query.search && searchFields.length) {
    where[Op.or] = searchFields.map((f) => ({ [f]: { [Op.like]: `%${query.search}%` } }));
  }

  // Filters
  allowedFilters.forEach((f) => {
    if (query[f] != null && query[f] !== '') {
      if (Array.isArray(query[f])) where[f] = { [Op.in]: query[f] };
      else where[f] = query[f];
    }
  });

  // Date range
  if (query.from || query.to) {
    where.created_at = {};
    if (query.from) where.created_at[Op.gte] = new Date(query.from);
    if (query.to) where.created_at[Op.lte] = new Date(query.to);
  }

  // Sort: ?sort=-created_at,name
  const order = (query.sort || defaultSort)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.startsWith('-') ? [s.slice(1), 'DESC'] : [s, 'ASC']));

  return { where, limit, offset, order, page };
};

module.exports.paginate = (count, page, limit) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit),
  hasNext: page * limit < count,
  hasPrev: page > 1,
});