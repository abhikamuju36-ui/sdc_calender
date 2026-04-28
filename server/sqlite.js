const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'events.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database for shared events.');
    createTable();
  }
});

function createTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      endDate TEXT,
      category TEXT NOT NULL,
      allDay INTEGER DEFAULT 0,
      time TEXT,
      endTime TEXT,
      location TEXT,
      description TEXT,
      repeat TEXT DEFAULT 'none',
      notify INTEGER,
      pinned INTEGER DEFAULT 0,
      creatorEmail TEXT,
      creatorName TEXT,
      approved INTEGER DEFAULT 0
    )
  `, (err) => {
    if (err) return;
    db.run(`CREATE INDEX IF NOT EXISTS idx_events_date     ON events(date)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_events_creator  ON events(creatorEmail)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_events_approved ON events(approved)`);
  });
}

const sqlite = {
  getAllEvents: () => new Promise((res, rej) => {
    db.all(`SELECT * FROM events`, [], (err, rows) => {
      if (err) return rej(err);
      // Convert integers back to booleans
      const mapped = rows.map(r => ({
        ...r,
        allDay: !!r.allDay,
        pinned: !!r.pinned,
        approved: !!r.approved
      }));
      res(mapped);
    });
  }),

  addEvent: (ev) => new Promise((res, rej) => {
    const sql = `
      INSERT INTO events (
        id, title, date, endDate, category, allDay, time, endTime, 
        location, description, repeat, notify, pinned, creatorEmail, creatorName, approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      ev.id, ev.title, ev.date, ev.endDate, ev.category, ev.allDay ? 1 : 0, ev.time, ev.endTime,
      ev.location, ev.description, ev.repeat || 'none', ev.notify || null, ev.pinned ? 1 : 0,
      ev.creatorEmail, ev.creatorName, ev.approved ? 1 : 0
    ];
    db.run(sql, params, function(err) {
      if (err) return rej(err);
      res({ id: ev.id, ...ev });
    });
  }),

  updateEvent: (id, ev) => new Promise((res, rej) => {
    const sql = `
      UPDATE events SET 
        title = ?, date = ?, endDate = ?, category = ?, allDay = ?, time = ?, endTime = ?,
        location = ?, description = ?, repeat = ?, notify = ?, pinned = ?, approved = ?
      WHERE id = ?
    `;
    const params = [
      ev.title, ev.date, ev.endDate, ev.category, ev.allDay ? 1 : 0, ev.time, ev.endTime,
      ev.location, ev.description, ev.repeat || 'none', ev.notify || null, ev.pinned ? 1 : 0,
      ev.approved ? 1 : 0, id
    ];
    db.run(sql, params, function(err) {
      if (err) return rej(err);
      res({ success: true });
    });
  }),

  deleteEvent: (id) => new Promise((res, rej) => {
    db.run(`DELETE FROM events WHERE id = ?`, [id], function(err) {
      if (err) return rej(err);
      res({ success: true });
    });
  }),

  approveEvent: (id) => new Promise((res, rej) => {
    db.run(`UPDATE events SET approved = 1 WHERE id = ?`, [id], function(err) {
      if (err) return rej(err);
      res({ success: true });
    });
  })
};

module.exports = sqlite;
