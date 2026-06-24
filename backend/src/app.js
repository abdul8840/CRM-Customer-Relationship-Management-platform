require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const Handlebars = require('handlebars');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');

Handlebars.registerHelper('eq', (a, b) => a === b);

const app = express();
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com", "https://lumberjack.razorpay.com", "wss:", "ws:"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({ origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean), credentials: true }));
app.use(compression());

const API = process.env.API_PREFIX || '/api/v1';

// Razorpay webhook needs raw body — mount BEFORE json parser
app.use(`${API}/webhooks`, require('./modules/webhook/webhook.routes'));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use(`${API}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(API, apiLimiter);

app.use(`${API}/auth`, require('./modules/auth/auth.routes'));
app.use(`${API}/users`, require('./modules/user/user.routes'));
app.use(`${API}/roles`, require('./modules/role/role.routes'));
app.use(`${API}/companies`, require('./modules/company/company.routes'));
app.use(`${API}/contacts`, require('./modules/contact/contact.routes'));
app.use(`${API}/leads`, require('./modules/lead/lead.routes'));
app.use(`${API}/deals`, require('./modules/deal/deal.routes'));
app.use(`${API}/tasks`, require('./modules/task/task.routes'));
app.use(`${API}/notes`, require('./modules/note/note.routes'));
app.use(`${API}/activities`, require('./modules/activity/activity.routes'));
app.use(`${API}/attachments`, require('./modules/attachment/attachment.routes'));
app.use(`${API}/subscriptions`, require('./modules/subscription/subscription.routes'));
app.use(`${API}/notifications`, require('./modules/notification/notification.routes'));
app.use(`${API}/tickets`, require('./modules/ticket/ticket.routes'));
app.use(`${API}/faqs`, require('./modules/faq/faq.routes'));
app.use(`${API}/announcements`, require('./modules/announcement/announcement.routes'));
app.use(`${API}/settings`, require('./modules/setting/setting.routes'));
app.use(`${API}/dashboard`, require('./modules/dashboard/dashboard.routes'));
app.use(`${API}/admin`, require('./modules/admin/admin.routes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;