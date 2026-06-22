const { Plan, Subscription, Invoice, Payment, User } = require('../../models');
const razorpay = require('../../services/razorpay.service');
const brevo = require('../../services/brevo.service');
const ApiError = require('../../utils/ApiError');
const log = require('../../core/activityLogger');

const invoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

class SubscriptionService {
  listPlans = () => Plan.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC'], ['price', 'ASC']] });

  getMine = async (user) => Subscription.findOne({ where: { user_id: user.id }, include: [{ model: Plan, as: 'plan' }] });

  async startCheckout(user, plan_id) {
    const plan = await Plan.findByPk(plan_id);
    if (!plan || !plan.is_active) throw new ApiError(404, 'Plan unavailable');

    if (plan.price <= 0) {
      // Free plan — activate immediately
      let sub = await this.getMine(user);
      const start = new Date();
      const end = new Date(); end.setMonth(end.getMonth() + (plan.interval === 'year' ? 12 : 1));
      if (sub) { await sub.update({ plan_id: plan.id, status: 'active', current_period_start: start, current_period_end: end }); }
      else { sub = await Subscription.create({ user_id: user.id, plan_id: plan.id, status: 'active', current_period_start: start, current_period_end: end }); }
      return { sub, free: true };
    }

    const order = await razorpay.createOrder(Number(plan.price), plan.currency, `plan_${plan.id}_user_${user.id}`);
    await Payment.create({ user_id: user.id, razorpay_order_id: order.id, amount: plan.price, currency: plan.currency, status: 'created', meta: { plan_id: plan.id } });
    return { order, key_id: process.env.RAZORPAY_KEY_ID, plan };
  }

  async verifyAndActivate(user, { order_id, payment_id, signature, plan_id }) {
    if (!razorpay.verifyPaymentSignature({ order_id, payment_id, signature })) throw new ApiError(400, 'Invalid payment signature');

    const plan = await Plan.findByPk(plan_id);
    const start = new Date();
    const end = new Date(); end.setMonth(end.getMonth() + (plan.interval === 'year' ? 12 : 1));

    let sub = await this.getMine(user);
    if (sub) await sub.update({ plan_id: plan.id, status: 'active', current_period_start: start, current_period_end: end, canceled_at: null });
    else sub = await Subscription.create({ user_id: user.id, plan_id: plan.id, status: 'active', current_period_start: start, current_period_end: end });

    const total = Number(plan.price);
    const invoice = await Invoice.create({
      invoice_number: invoiceNumber(), user_id: user.id, subscription_id: sub.id,
      amount: total, tax: 0, total, currency: plan.currency,
      status: 'paid', paid_at: new Date(), due_date: new Date(),
    });

    await Payment.update(
      { status: 'captured', razorpay_payment_id: payment_id, razorpay_signature: signature, invoice_id: invoice.id, subscription_id: sub.id },
      { where: { razorpay_order_id: order_id } }
    );

    await log({ user, type: 'subscription.activated', title: `Subscribed to ${plan.name}`, relatedToType: 'subscription', relatedToId: sub.id });
    brevo.sendSubscriptionUpdate(user.email, { action: 'activated', plan_name: plan.name, status: 'active' });
    brevo.sendInvoice(user.email, { invoice_number: invoice.invoice_number, total, currency: plan.currency, status: 'paid', due_date: invoice.due_date });
    return { sub, invoice };
  }

  async cancel(user) {
    const sub = await this.getMine(user);
    if (!sub) throw new ApiError(404, 'No active subscription');
    await sub.update({ status: 'canceled', canceled_at: new Date() });
    if (sub.razorpay_subscription_id) {
      try { await razorpay.cancelSubscription(sub.razorpay_subscription_id, true); } catch (_) {}
    }
    brevo.sendSubscriptionUpdate(user.email, { action: 'canceled', plan_name: sub.plan?.name, status: 'canceled' });
    return sub;
  }

  invoices = (user) => Invoice.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
  payments = (user) => Payment.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
}

module.exports = new SubscriptionService();