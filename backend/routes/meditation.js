const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/meditation?date=YYYY-MM-DD
router.get('/', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const session = db.prepare(
    'SELECT * FROM meditation_sessions WHERE date = ? ORDER BY id DESC LIMIT 1'
  ).get(date);
  res.json(session || null);
});

// POST /api/meditation/log  { date?, duration_minutes }
router.post('/log', (req, res) => {
  const { date, duration_minutes } = req.body;
  if (duration_minutes == null) return res.status(400).json({ error: 'duration_minutes required' });
  const day = date || new Date().toISOString().slice(0, 10);
  const mins = parseFloat(duration_minutes);

  // Upsert meditation_sessions
  const existing = db.prepare('SELECT id FROM meditation_sessions WHERE date = ?').get(day);
  if (existing) {
    db.prepare('UPDATE meditation_sessions SET duration_minutes = ?, source = ? WHERE date = ?')
      .run(mins, 'manual', day);
  } else {
    db.prepare('INSERT INTO meditation_sessions (date, duration_minutes, source) VALUES (?, ?, ?)')
      .run(day, mins, 'manual');
  }

  // Upsert health_metrics so trends + today endpoint stay consistent
  const existingMetric = db.prepare(
    `SELECT id FROM health_metrics WHERE date = ? AND metric_type = 'mindful_minutes'`
  ).get(day);
  if (existingMetric) {
    db.prepare(`UPDATE health_metrics SET value = ?, source = ? WHERE id = ?`)
      .run(mins, 'manual', existingMetric.id);
  } else {
    db.prepare(
      `INSERT INTO health_metrics (date, metric_type, value, unit, source) VALUES (?, 'mindful_minutes', ?, 'min', 'manual')`
    ).run(day, mins);
  }

  res.json({ ok: true, date: day, duration_minutes: mins });
});

module.exports = router;
