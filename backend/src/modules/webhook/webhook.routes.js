const router = require('express').Router();
const express = require('express');
const razorpay = require('../../services/razorpay.service');
const { Payment, Invoice, Subscription } = require('../../models');
const logger = require('../../config/logger');

// Raw body required for signature verification
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['x-razorpay-signature'];
    const raw = req.body.toString('utf8');
    if (!razorpay.verifyWebhook(raw, sig)) return res.status(400).send('Invalid signature');

    const event = JSON.parse(raw);
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
        await Subscription.update({ status: 'active' }, { where: { razorpay_subscription_id: s.id } });
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