const { Plan, Subscription, Invoice, Payment, User } = require('../../models');
const razorpay = require('../../services/razorpay.service');
const brevo = require('../../services/brevo.service');
const ApiError = require('../../utils/ApiError');
const log = require('../../core/activityLogger');
const { generateInvoicePdf } = require('../../services/pdf.service');

const invoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

class SubscriptionService {
  listPlans = () => Plan.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC'], ['price', 'ASC']] });
  getMine = (user) => Subscription.findOne({ where: { user_id: user.id }, include: [{ model: Plan, as: 'plan' }] });

  async startCheckout(user, plan_id) {
    const plan = await Plan.findByPk(plan_id);
    if (!plan || !plan.is_active) throw new ApiError(404, 'Plan unavailable');

    // Free plan — activate immediately
    if (plan.price <= 0) {
      let sub = await this.getMine(user);
      const start = new Date();
      const end = new Date(); end.setMonth(end.getMonth() + (plan.interval === 'year' ? 12 : 1));
      if (sub) await sub.update({ plan_id: plan.id, status: 'active', current_period_start: start, current_period_end: end });
      else sub = await Subscription.create({ user_id: user.id, plan_id: plan.id, status: 'active', current_period_start: start, current_period_end: end });
      return { sub, free: true };
    }

    // True Razorpay recurring subscription
    if (!plan.razorpay_plan_id) {
      throw new ApiError(500, 'Plan has no razorpay_plan_id configured. Create the plan in Razorpay dashboard and update it via Admin > Plans.');
    }

    const totalCount = plan.interval === 'year' ? 5 : 60;  // 5 years / 60 months
    const rzpSub = await razorpay.createSubscription(plan.razorpay_plan_id, totalCount);

    // Save pending subscription
    let sub = await this.getMine(user);
    const payload = {
      plan_id: plan.id,
      status: 'trial',
      razorpay_subscription_id: rzpSub.id,
    };
    if (sub) await sub.update(payload);
    else sub = await Subscription.create({ user_id: user.id, ...payload });

    return {
      subscription_id: rzpSub.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan,
    };
  }

  async verifyAndActivate(user, { subscription_id, payment_id, signature }) {
    if (!razorpay.verifySubscriptionSignature({ subscription_id, payment_id, signature }))
      throw new ApiError(400, 'Invalid payment signature');

    const sub = await Subscription.findOne({ where: { user_id: user.id, razorpay_subscription_id: subscription_id }, include: [{ model: Plan, as: 'plan' }] });
    if (!sub) throw new ApiError(404, 'Subscription not found');

    const start = new Date();
    const end = new Date(); end.setMonth(end.getMonth() + (sub.plan.interval === 'year' ? 12 : 1));
    await sub.update({ status: 'active', current_period_start: start, current_period_end: end, canceled_at: null });

    const total = Number(sub.plan.price);
    const invoice = await Invoice.create({
      invoice_number: invoiceNumber(), user_id: user.id, subscription_id: sub.id,
      amount: total, tax: 0, total, currency: sub.plan.currency,
      status: 'paid', paid_at: new Date(), due_date: new Date(),
    });

    // Generate PDF & email
    try {
      const pdfUrl = await generateInvoicePdf({ invoice, user, plan: sub.plan });
      await invoice.update({ pdf_url: pdfUrl });
    } catch (e) {}

    await Payment.create({
      user_id: user.id, invoice_id: invoice.id, subscription_id: sub.id,
      razorpay_payment_id: payment_id, razorpay_signature: signature,
      amount: total, currency: sub.plan.currency, status: 'captured',
    });

    await log({ user, type: 'subscription.activated', title: `Subscribed to ${sub.plan.name}`, relatedToType: 'subscription', relatedToId: sub.id });
    brevo.sendSubscriptionUpdate(user.email, { action: 'activated', plan_name: sub.plan.name, status: 'active' });
    brevo.sendInvoice(user.email, { invoice_number: invoice.invoice_number, total, currency: sub.plan.currency, status: 'paid', due_date: invoice.due_date, pdf_url: invoice.pdf_url });
    return { sub, invoice };
  }

  async cancel(user) {
    const sub = await this.getMine(user);
    if (!sub) throw new ApiError(404, 'No active subscription');
    if (sub.razorpay_subscription_id) {
      try { await razorpay.cancelSubscription(sub.razorpay_subscription_id, true); } catch (_) {}
    }
    await sub.update({ status: 'canceled', canceled_at: new Date() });
    brevo.sendSubscriptionUpdate(user.email, { action: 'canceled', plan_name: sub.plan?.name, status: 'canceled' });
    return sub;
  }

  invoices = (user) => Invoice.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
  payments = (user) => Payment.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']] });
}

module.exports = new SubscriptionService();