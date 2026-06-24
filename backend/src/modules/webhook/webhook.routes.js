const router = require('express').Router();
const express = require('express');
const razorpay = require('../../services/razorpay.service');
const { Payment, Invoice, Subscription, User, Plan } = require('../../models');
const brevo = require('../../services/brevo.service');
const { generateInvoicePdf } = require('../../services/pdf.service');
const logger = require('../../config/logger');

const seenEvents = new Map(); // simple in-memory idempotency (replace with Redis in prod)

router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const raw = req.body.toString('utf8');
    if (!razorpay.verifyWebhook(raw, sig)) return res.status(400).send('Invalid signature');

    const event = JSON.parse(raw);
    const eventId = `${event.event}:${event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id || event.created_at}`;
    if (seenEvents.has(eventId)) return res.json({ received: true, idempotent: true });
    seenEvents.set(eventId, Date.now());
    if (seenEvents.size > 1000) {
      const oldest = [...seenEvents.entries()].sort((a, b) => a[1] - b[1]).slice(0, 200);
      oldest.forEach(([k]) => seenEvents.delete(k));
    }

    logger.info(`Razorpay webhook: ${event.event}`);

    switch (event.event) {
      case 'payment.captured': {
        const p = event.payload.payment.entity;
        await Payment.update({ status: 'captured', razorpay_payment_id: p.id, method: p.method, meta: p }, { where: { razorpay_order_id: p.order_id } });
        break;
      }
      case 'payment.failed': {
        const p = event.payload.payment.entity;
        await Payment.update({ status: 'failed', meta: p }, { where: { razorpay_order_id: p.order_id } });
        break;
      }
      case 'subscription.charged': {
        const s = event.payload.subscription.entity;
        const p = event.payload.payment?.entity;
        const sub = await Subscription.findOne({ where: { razorpay_subscription_id: s.id }, include: [{ model: Plan, as: 'plan' }, { model: User, as: 'user' }] });
        if (sub) {
          const start = new Date(s.current_start * 1000);
          const end = new Date(s.current_end * 1000);
          await sub.update({ status: 'active', current_period_start: start, current_period_end: end });

          // Auto-generate invoice for the renewal
          if (p) {
            const total = p.amount / 100;
            const inv = await Invoice.create({
              invoice_number: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              user_id: sub.user_id, subscription_id: sub.id,
              amount: total, tax: 0, total, currency: p.currency,
              status: 'paid', paid_at: new Date(), due_date: new Date(),
            });
            try {
              const pdfUrl = await generateInvoicePdf({ invoice: inv, user: sub.user, plan: sub.plan });
              await inv.update({ pdf_url: pdfUrl });
            } catch {}
            await Payment.create({
              user_id: sub.user_id, invoice_id: inv.id, subscription_id: sub.id,
              razorpay_payment_id: p.id, amount: total, currency: p.currency, status: 'captured', method: p.method, meta: p,
            });
            if (sub.user) brevo.sendInvoice(sub.user.email, { invoice_number: inv.invoice_number, total, currency: p.currency, status: 'paid', due_date: inv.due_date, pdf_url: inv.pdf_url });
          }
        }
        break;
      }
      case 'subscription.halted':
      case 'subscription.pending': {
        const s = event.payload.subscription.entity;
        await Subscription.update({ status: 'past_due' }, { where: { razorpay_subscription_id: s.id } });
        break;
      }
      case 'subscription.cancelled':
      case 'subscription.completed': {
        const s = event.payload.subscription.entity;
        await Subscription.update({ status: 'canceled', canceled_at: new Date() }, { where: { razorpay_subscription_id: s.id } });
        break;
      }
      case 'invoice.paid': {
        const i = event.payload.invoice.entity;
        await Invoice.update({ status: 'paid', paid_at: new Date() }, { where: { razorpay_invoice_id: i.id } });
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    logger.error(`Webhook error: ${err.message}`);
    res.status(500).send('Webhook handler failed');
  }
});

module.exports = router;