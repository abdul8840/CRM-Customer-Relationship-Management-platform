const Sentry = require('@sentry/node');
module.exports = {
  init: (app) => {
    if (!process.env.SENTRY_DSN) return null;
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    });
    Sentry.setupExpressErrorHandler(app);
    return Sentry;
  },
  Sentry,
};