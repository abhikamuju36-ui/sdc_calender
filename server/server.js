require('dotenv').config();

const express = require('express');
const session = require('express-session');
const corsMiddleware = require('cors');
const path    = require('path');

require('./db'); // initialises NeDB datastores on load
const authRouter        = require('./auth');
const adminRouter       = require('./routes/admin');
const smartsheetRouter  = require('./routes/smartsheet');

const app      = express();
const API_PORT = process.env.PORT        || 3001;
const WEB_PORT = process.env.WEB_PORT    || 3000;
const STATIC_DIR = path.join(__dirname, '..');  // parent folder = project root

// ── Middleware ────────────────────────────────────────────
app.use(corsMiddleware({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    `http://localhost:${WEB_PORT}`,
    `http://localhost:${API_PORT}`,
  ],
  credentials: true,
}));

app.use(express.json());

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
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Serve static calendar files ───────────────────────────
app.use(express.static(STATIC_DIR));
// Catch-all: serve the calendar HTML for any unknown path
app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'SDC Centralized Calendar.html'));
});

// ── Start both servers ────────────────────────────────────
// API server on 3001 (handles auth callbacks from Azure)
app.listen(API_PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ✅ SDC Calendar running');
  console.log(`  🌐 Frontend: http://localhost:${WEB_PORT}`);
  console.log(`  🔧 API:      http://localhost:${API_PORT}`);
  console.log(`  🔐 Login:    http://localhost:${API_PORT}/auth/login`);
  console.log('');
});

// Web server on 3000 (serves static files, same Express app)
app.listen(WEB_PORT, '0.0.0.0', () => {
  console.log(`  📅 Open calendar: http://localhost:${WEB_PORT}/SDC%20Centralized%20Calendar.html`);
});
