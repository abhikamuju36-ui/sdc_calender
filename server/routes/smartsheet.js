// ── Smartsheet API proxy routes ───────────────────────────────
// Uses SMARTSHEET_API_TOKEN from .env — no OAuth needed.
// All endpoints sit behind /api/smartsheet

const express = require('express');
const https   = require('https');
const router  = express.Router();

// ── Tiny HTTPS GET helper ─────────────────────────────────────
function ssGet(path) {
  return new Promise((resolve, reject) => {
    const token = process.env.SMARTSHEET_API_TOKEN;
    const opts = {
      hostname: 'api.smartsheet.com',
      path:     `/2.0${path}`,
      method:   'GET',
      headers:  { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try   { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('Invalid JSON from Smartsheet')); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ── Guard: token must be present ─────────────────────────────
router.use((req, res, next) => {
  if (!process.env.SMARTSHEET_API_TOKEN) {
    return res.status(503).json({ error: 'SMARTSHEET_API_TOKEN not configured in server/.env' });
  }
  next();
});

// ── GET /api/smartsheet/status ────────────────────────────────
// Returns connected user info
router.get('/status', async (req, res) => {
  try {
    const user = await ssGet('/users/me');
    if (user.errorCode) return res.status(401).json({ connected: false, error: user.message });
    res.json({ connected: true, name: user.name, email: user.email });
  } catch (e) {
    res.status(500).json({ connected: false, error: e.message });
  }
});

// ── GET /api/smartsheet/sheets ────────────────────────────────
// Lists all sheets the token can access
router.get('/sheets', async (req, res) => {
  try {
    const data = await ssGet('/sheets?pageSize=100&includeAll=true');
    if (data.errorCode) return res.status(400).json({ error: data.message });
    res.json(Array.isArray(data.data) ? data.data : []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/smartsheet/sync ─────────────────────────────────
// Body: { sheetIds: [id, ...] }
// Returns mapped calendar-ready events (all marked category:'personal')
router.post('/sync', async (req, res) => {
  try {
    const { sheetIds = [] } = req.body;
    if (!sheetIds.length) return res.json([]);

    const events = [];

    for (const sheetId of sheetIds) {
      let sheet;
      try {
        sheet = await ssGet(`/sheets/${sheetId}`);
      } catch (e) {
        continue; // skip sheets we can't fetch
      }
      if (sheet.errorCode) continue;

      // Build columnId → lowercase title map
      const colMap = {};
      (sheet.columns || []).forEach(col => {
        colMap[col.id] = (col.title || '').toLowerCase().trim();
      });

      // Return the first cell whose column title contains ANY of the given keywords
      const findCell = (cells, ...keywords) => {
        for (const cell of cells) {
          const colTitle = colMap[cell.columnId] || '';
          if (keywords.some(kw => colTitle.includes(kw.toLowerCase()))) {
            const v = cell.displayValue !== undefined ? cell.displayValue : cell.value;
            return v !== undefined && v !== null ? String(v) : null;
          }
        }
        return null;
      };

      // Normalize any date string to YYYY-MM-DD
      const normDate = (raw) => {
        if (!raw) return null;
        if (/^\d{4}-\d{2}-\d{2}/.test(String(raw))) return String(raw).substring(0, 10);
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        return null;
      };

      for (const row of (sheet.rows || [])) {
        const cells = row.cells || [];

        const title      = findCell(cells, 'task name', 'name', 'subject', 'title')
                        || findCell(cells, 'task');
        const startRaw   = findCell(cells, 'start date', 'start');
        const endRaw     = findCell(cells, 'finish date', 'finish', 'end date', 'due date', 'due', 'end', 'complete date');
        const pct        = findCell(cells, '% complete', 'percent complete', '% allo', '% all', 'completion');
        const manager    = findCell(cells, 'manager', 'assigned to', 'owner', 'responsible');
        const comments   = findCell(cells, 'task list', 'comments', 'notes', 'description');
        const duration   = findCell(cells, 'duration');
        const status     = findCell(cells, 'status');

        // Skip blank rows
        if (!title && !startRaw) continue;

        const startDate = normDate(startRaw);
        if (!startDate) continue; // can't place on calendar without a date

        const endDate = normDate(endRaw);

        events.push({
          id:          `ss_${sheet.id}_${row.id}`,
          title:       String(title || `Row ${row.rowNumber}`),
          date:        startDate,
          endDate:     (endDate && endDate !== startDate) ? endDate : null,
          category:    'personal',
          source:      'smartsheet',
          sheetId:     String(sheet.id),
          sheetName:   sheet.name,
          rowId:       String(row.id),
          pctComplete: pct  || null,
          manager:     manager || null,
          description: comments || '',
          duration:    duration || null,
          status:      status   || null,
          seeded:      false,
          allDay:      true,
        });
      }
    }

    res.json(events);
  } catch (e) {
    console.error('Smartsheet sync error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
