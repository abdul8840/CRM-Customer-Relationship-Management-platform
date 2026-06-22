const { Op, fn, col } = require('sequelize');
const { Deal, Company, Contact, sequelize } = require('../../models');
const BaseService = require('../../core/BaseService');
const log = require('../../core/activityLogger');

const STAGE_PROBABILITIES = { lead: 10, qualified: 25, proposal_sent: 50, negotiation: 75, won: 100, lost: 0 };

class DealService extends BaseService {
  constructor() {
    super(Deal, {
      searchFields: ['title'],
      allowedFilters: ['stage', 'assigned_to', 'company_id'],
      includes: [
        { model: Company, as: 'company', attributes: ['id', 'name'] },
        { model: Contact, as: 'contact', attributes: ['id', 'first_name', 'last_name', 'email'] },
      ],
    });
  }

  async kanban(user, query = {}) {
    const where = { ...this.scopeFor(user) };
    if (query.assigned_to) where.assigned_to = query.assigned_to;
    const deals = await Deal.findAll({
      where, include: this.opts.includes,
      order: [['stage_order', 'ASC'], ['created_at', 'DESC']],
    });
    const stages = ['lead', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost'];
    const board = Object.fromEntries(stages.map((s) => [s, []]));
    deals.forEach((d) => board[d.stage]?.push(d));
    return board;
  }

  async moveStage(user, id, stage, stage_order) {
    const deal = await this.get(user, id);
    const updates = { stage, probability: STAGE_PROBABILITIES[stage] ?? deal.probability };
    if (stage_order != null) updates.stage_order = stage_order;
    if (stage === 'won' || stage === 'lost') updates.actual_close_date = new Date();
    await deal.update(updates);
    await log({ user, type: 'deal.stage_changed', title: `Deal moved to ${stage}`, relatedToType: 'deal', relatedToId: deal.id, meta: { stage } });
    return deal;
  }

  async pipelineStats(user) {
    const scope = this.scopeFor(user);
    const data = await Deal.findAll({
      where: scope,
      attributes: ['stage', [fn('COUNT', col('id')), 'count'], [fn('SUM', col('value')), 'total_value']],
      group: ['stage'], raw: true,
    });
    return data;
  }
}

module.exports = new DealService();