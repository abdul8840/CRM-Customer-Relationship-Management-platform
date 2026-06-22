const Razorpay = require('razorpay');
const crypto = require('crypto');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
  instance,
  createOrder: (amount, currency = 'INR', receipt) =>
    instance.orders.create({ amount: Math.round(amount * 100), currency, receipt, payment_capture: 1 }),
  createSubscription: (plan_id, total_count = 12) =>
    instance.subscriptions.create({ plan_id, total_count, customer_notify: 1 }),
  cancelSubscription: (sub_id, cancel_at_cycle_end = false) =>
    instance.subscriptions.cancel(sub_id, cancel_at_cycle_end),
  verifyPaymentSignature: ({ order_id, payment_id, signature }) => {
    const body = `${order_id}|${payment_id}`;
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
    return expected === signature;
  },
  verifyWebhook: (body, signature) => {
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');
    return expected === signature;
  },
};