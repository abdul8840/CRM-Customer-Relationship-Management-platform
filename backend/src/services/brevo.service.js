const SibApiV3Sdk = require('sib-api-v3-sdk');
const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const logger = require('../config/logger');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
const transac = new SibApiV3Sdk.TransactionalEmailsApi();

const cache = {};
const loadTemplate = (name) => {
  if (cache[name]) return cache[name];
  const file = path.join(__dirname, '../templates/email', `${name}.hbs`);
  const tmpl = Handlebars.compile(fs.readFileSync(file, 'utf8'));
  cache[name] = tmpl;
  return tmpl;
};

const sendEmail = async ({ to, subject, template, data = {} }) => {
  try {
    if (!process.env.BREVO_API_KEY) { logger.warn('BREVO_API_KEY missing — email skipped'); return; }
    const htmlContent = loadTemplate(template)({ ...data, year: new Date().getFullYear() });
    const payload = {
      sender: { name: process.env.BREVO_SENDER_NAME, email: process.env.BREVO_SENDER_EMAIL },
      to: Array.isArray(to) ? to : [{ email: to }],
      subject, htmlContent,
    };
    await transac.sendTransacEmail(payload);
    logger.info(`📧 Email sent: ${template} → ${Array.isArray(to) ? to[0].email : to}`);
  } catch (err) { logger.error(`Email send failed: ${err.message}`); }
};

module.exports = {
  sendEmail,
  sendOtp: (to, code, purpose) => sendEmail({
    to, subject: purpose === 'password_reset' ? 'Reset your password' : 'Verify your email',
    template: 'otp', data: { code, purpose },
  }),
  sendWelcome: (to, name) => sendEmail({ to, subject: 'Welcome to our CRM', template: 'welcome', data: { name } }),
  sendInvoice: (to, data) => sendEmail({ to, subject: `Invoice ${data.invoice_number}`, template: 'invoice', data }),
  sendTaskReminder: (to, data) => sendEmail({ to, subject: `Task reminder: ${data.title}`, template: 'task-reminder', data }),
  sendSubscriptionUpdate: (to, data) => sendEmail({ to, subject: `Subscription ${data.action}`, template: 'subscription', data }),
};