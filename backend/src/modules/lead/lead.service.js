const { Op } = require('sequelize');
const { Lead, Deal, Contact, Company, sequelize } = require('../../models');
const BaseService = require('../../core/BaseService');
const ApiError = require('../../utils/ApiError');
const log = require('../../core/activityLogger');

class LeadService extends BaseService {
  constructor() {
    super(Lead, {
      searchFields: ['first_name', 'last_name', 'email', 'company_name'],
      allowedFilters: ['status', 'source', 'priority', 'assigned_to'],
    });
  }

  async assign(user, id, assigned_to) {
    const lead = await this.get(user, id);
    await lead.update({ assigned_to });
    await log({ user, type: 'lead.assigned', title: `Lead assigned`, relatedToType: 'lead', relatedToId: lead.id, meta: { assigned_to } });
    return lead;
  }

  async convert(user, id, payload) {
    const lead = await this.get(user, id);
    if (lead.status === 'converted') throw new ApiError(400, 'Lead already converted');

    return sequelize.transaction(async (t) => {
      let company = null, contact = null;
      if (payload.create_company && lead.company_name) {
        company = await Company.create({ owner_id: user.id, name: lead.company_name }, { transaction: t });
      }
      if (payload.create_contact) {
        contact = await Contact.create({
          owner_id: user.id, company_id: company?.id,
          first_name: lead.first_name, last_name: lead.last_name,
          email: lead.email, phone: lead.phone, job_title: lead.job_title,
        }, { transaction: t });
      }
      const deal = await Deal.create({
        owner_id: user.id, assigned_to: lead.assigned_to,
        company_id: company?.id, contact_id: contact?.id, lead_id: lead.id,
        title: payload.deal_title, value: payload.deal_value, stage: 'qualified', probability: 25,
      }, { transaction: t });

      await lead.update({ status: 'converted', converted_at: new Date(), converted_deal_id: deal.id }, { transaction: t });
      await log({ user, type: 'lead.converted', title: 'Lead converted to deal', relatedToType: 'lead', relatedToId: lead.id, meta: { deal_id: deal.id } });
      return { lead, deal, company, contact };
    });
  }

  async bulkImport(user, rows = []) {
    const created = [];
    for (const r of rows) {
      try {
        const lead = await Lead.create({
          owner_id: user.id,
          first_name: r.first_name || r.firstName || 'Unknown',
          last_name: r.last_name || r.lastName,
          email: r.email, phone: r.phone,
          company_name: r.company_name || r.company,
          job_title: r.job_title, source: r.source || 'other',
        });
        created.push(lead);
      } catch (_) {}
    }
    return { created: created.length, total: rows.length };
  }

  async exportCsv(user, query) {
    const { items } = await this.list(user, { ...query, limit: 10000 });
    return items.map((l) => ({
      id: l.id, first_name: l.first_name, last_name: l.last_name,
      email: l.email, phone: l.phone, company: l.company_name,
      source: l.source, status: l.status, priority: l.priority,
      value: l.estimated_value, created_at: l.created_at,
    }));
  }

  async stats(user) {
    const scope = this.scopeFor(user);
    const [total, byStatus, bySource] = await Promise.all([
      Lead.count({ where: scope }),
      Lead.findAll({ where: scope, attributes: ['status', [sequelize.fn('COUNT', '*'), 'count']], group: ['status'], raw: true }),
      Lead.findAll({ where: scope, attributes: ['source', [sequelize.fn('COUNT', '*'), 'count']], group: ['source'], raw: true }),
    ]);
    return { total, byStatus, bySource };
  }
}

module.exports = new LeadService();