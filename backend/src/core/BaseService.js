const ApiError = require('../utils/ApiError');
const qb = require('./queryBuilder');

class BaseService {
  constructor(Model, { searchFields = [], allowedFilters = [], ownerField = 'owner_id', includes = [] } = {}) {
    this.Model = Model;
    this.opts = { searchFields, allowedFilters, ownerField, includes };
  }

  scopeFor(user) {
    // Owners see their own. Admin/manager/super_admin see all.
    const role = user.role?.slug;
    if (['super_admin', 'admin', 'manager'].includes(role)) return {};
    return { [this.opts.ownerField]: user.id };
  }

  async list(user, query) {
    const built = qb(query, this.opts);
    const where = { ...built.where, ...this.scopeFor(user) };
    const { rows, count } = await this.Model.findAndCountAll({
      where, limit: built.limit, offset: built.offset, order: built.order, include: this.opts.includes, distinct: true,
    });
    return { items: rows, meta: qb.paginate(count, built.page, built.limit) };
  }

  async get(user, id) {
    const item = await this.Model.findOne({
      where: { id, ...this.scopeFor(user) }, include: this.opts.includes,
    });
    if (!item) throw new ApiError(404, `${this.Model.name} not found`);
    return item;
  }

  async create(user, data) {
    return this.Model.create({ ...data, [this.opts.ownerField]: user.id });
  }

  async update(user, id, data) {
    const item = await this.get(user, id);
    await item.update(data);
    return item;
  }

  async delete(user, id) {
    const item = await this.get(user, id);
    await item.destroy();
    return true;
  }

  async bulkDelete(user, ids = []) {
    return this.Model.destroy({ where: { id: ids, ...this.scopeFor(user) } });
  }
}

module.exports = BaseService;