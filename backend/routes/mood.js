const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/mood
router.post('/', (req, res) => {
  const { mood, energy, note } = req.body;
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const time = req.body.time || new Date().toTimeString().slice(0, 5);

  if (!mood || !energy) return res.status(400).json({ error: 'mood and energy required' });

  const result = db.prepare(`
    INSERT INTO mood_logs (date, time, mood, energy, note) VALUES (?, ?, ?, ?, ?)
  `).run(date, time, mood, energy, note || null);

  res.json({ ok: true, id: result.lastInsertRowid });
});

// GET /api/mood/week
router.get('/week', (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const placeholders = days.map(() => '?').join(',');

  const rows = db.prepare(`
    SELECT * FROM mood_logs WHERE date IN (${placeholders}) ORDER BY date, time
  `).all(...days);

  res.json(rows);
});

module.exports = router;
