const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/mood
router.post('/', (req, res) => {
  console.log('📥 Mood POST received:', JSON.stringify(req.body));
  const { mood, energy, note } = req.body;
  // Always use server time — Shortcuts sends non-standard date formats
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5);

  if (!mood || !energy) {
    console.log('❌ Missing mood or energy. Got:', { mood, energy });
    return res.status(400).json({ error: 'mood and energy required', received: req.body });
  }

  const result = db.prepare(`
    INSERT INTO mood_logs (date, time, mood, energy, note) VALUES (?, ?, ?, ?, ?)
  `).run(date, time, mood, energy, note || null);

  console.log(`✅ Mood saved: mood=${mood} energy=${energy} date=${date}`);
  res.json({ ok: true, id: result.lastInsertRowid, mood, energy, date });
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
