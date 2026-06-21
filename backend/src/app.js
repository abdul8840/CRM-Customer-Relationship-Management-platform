require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { notFound, errorHandler } = require('./middleware/error.middleware');
const authRoutes = require('./modules/auth/auth.routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({
  origin: (process.env.CORS_ORIGINS || '').split(',').filter(Boolean),
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const API = process.env.API_PREFIX || '/api/v1';

app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.use(`${API}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(API, apiLimiter);
app.use(`${API}/auth`, authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;