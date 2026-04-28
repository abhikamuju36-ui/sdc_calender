require('dotenv').config();

const express = require('express');
const session = require('express-session');
const corsMiddleware = require('cors');
const path    = require('path');
const logger  = require('./logger');

require('./db'); // initialises NeDB datastores on load
const authRouter        = require('./auth');
const adminRouter       = require('./routes/admin');
const smartsheetRouter  = require('./routes/smartsheet');
const eventsRouter      = require('./routes/events');
const NotificationService = require('./notificationService');

NotificationService.start();

const app      = express();
const API_PORT = process.env.PORT        || 3002;
const WEB_PORT = process.env.WEB_PORT    || 3000;
const STATIC_DIR = path.join(__dirname, '..', 'frontend');

// ── Middleware ────────────────────────────────────────────
// ALLOWED_ORIGINS: comma-separated list in .env for production deployments
// e.g. ALLOWED_ORIGINS=http://calendar.sdcautomation.com,https://calendar.sdcautomation.com
const EXTRA_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);
const CORS_ORIGINS = [
  ...EXTRA_ORIGINS,
  `http://localhost:${WEB_PORT}`,
  `http://localhost:${API_PORT}`,
];
app.use(corsMiddleware({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));

app.use(express.json());

// Winston HTTP Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms [IP: ${req.ip}]`);
  });
  next();
});

app.use(session({
  secret:            process.env.SESSION_SECRET || 'sdc-session-fallback',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false, maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
}));

// ── API Routes ────────────────────────────────────────────
app.use('/auth',             authRouter);
app.use('/api/admin',        adminRouter);
app.use('/api/smartsheet',   smartsheetRouter);
app.use('/api/events',       eventsRouter);
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Serve static calendar files ───────────────────────────
app.use(express.static(STATIC_DIR));
// Catch-all: serve the calendar HTML for any unknown path
app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ── Start both servers ────────────────────────────────────
// API server on 3001 (handles auth callbacks from Azure)
app.listen(API_PORT, '0.0.0.0', () => {
  logger.info(`API Server listening on port ${API_PORT}`);
  logger.info(`SSO Callback route configured at: http://localhost:${API_PORT}/auth/login`);
});

app.listen(WEB_PORT, '0.0.0.0', () => {
  logger.info(`Web Frontend Server listening on port ${WEB_PORT}`);
  logger.info(`SDC Calendar initialized successfully — client access mapped`);
});
