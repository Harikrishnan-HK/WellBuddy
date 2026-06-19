const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/weight/logs — last 90 days
router.get('/logs', (req, res) => {
  const rows = db.prepare(`
    SELECT date, weight_kg FROM weight_logs
    ORDER BY date DESC LIMIT 90
  `).all();
  res.json(rows.reverse());
});

// POST /api/weight/log — upsert today's weight
router.post('/log', (req, res) => {
  const { weight_kg, date } = req.body;
  if (!weight_kg || isNaN(weight_kg)) return res.status(400).json({ error: 'weight_kg required' });
  const day = date || new Date().toISOString().slice(0, 10);
  db.prepare(`
    INSERT INTO weight_logs (date, weight_kg) VALUES (?, ?)
    ON CONFLICT(date) DO UPDATE SET weight_kg = excluded.weight_kg, logged_at = datetime('now')
  `).run(day, parseFloat(weight_kg));
  // Also upsert into health_metrics so today tab picks it up
  db.prepare(`
    INSERT INTO health_metrics (date, metric_type, value, unit)
    VALUES (?, 'weight_kg', ?, 'kg')
    ON CONFLICT DO NOTHING
  `).run(day, parseFloat(weight_kg));
  res.json({ ok: true, date: day, weight_kg: parseFloat(weight_kg) });
});

// GET /api/weight/goals
router.get('/goals', (req, res) => {
  const row = db.prepare('SELECT * FROM weight_goals WHERE id = 1').get();
  res.json(row || {});
});

// PUT /api/weight/goals
router.put('/goals', (req, res) => {
  const { start_weight, target_weight, height_cm } = req.body;
  db.prepare(`
    UPDATE weight_goals
    SET start_weight = COALESCE(?, start_weight),
        target_weight = COALESCE(?, target_weight),
        height_cm = COALESCE(?, height_cm),
        updated_at = datetime('now')
    WHERE id = 1
  `).run(start_weight ?? null, target_weight ?? null, height_cm ?? null);
  const row = db.prepare('SELECT * FROM weight_goals WHERE id = 1').get();
  res.json(row);
});

module.exports = router;
