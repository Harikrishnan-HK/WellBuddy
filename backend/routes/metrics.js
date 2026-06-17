const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/metrics/today
router.get('/today', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const metrics = db.prepare(`
    SELECT metric_type, value, unit FROM health_metrics
    WHERE date = ?
  `).all(today);

  const metricMap = {};
  for (const m of metrics) metricMap[m.metric_type] = { value: m.value, unit: m.unit };

  const workouts = db.prepare(`
    SELECT * FROM workouts WHERE date = ?
  `).all(today);

  const mood = db.prepare(`
    SELECT * FROM mood_logs WHERE date = ? ORDER BY time DESC LIMIT 1
  `).get(today);

  const meditation = db.prepare(`
    SELECT SUM(duration_minutes) as total FROM meditation_sessions WHERE date = ?
  `).get(today);

  res.json({
    date: today,
    metrics: metricMap,
    workouts,
    mood: mood || null,
    meditation_minutes: meditation?.total || 0,
  });
});

// GET /api/metrics/week
router.get('/week', (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const placeholders = days.map(() => '?').join(',');

  const rows = db.prepare(`
    SELECT date, metric_type, value FROM health_metrics
    WHERE date IN (${placeholders})
    ORDER BY date
  `).all(...days);

  // Group by date
  const byDate = {};
  for (const d of days) byDate[d] = {};
  for (const r of rows) {
    if (!byDate[r.date]) byDate[r.date] = {};
    byDate[r.date][r.metric_type] = r.value;
  }

  const workouts = db.prepare(`
    SELECT date, workout_type, duration_minutes, calories_burned FROM workouts
    WHERE date IN (${placeholders})
  `).all(...days);

  const moods = db.prepare(`
    SELECT date, mood, energy FROM mood_logs
    WHERE date IN (${placeholders})
    ORDER BY date, time DESC
  `).all(...days);

  res.json({ days, metrics: byDate, workouts, moods });
});

// GET /api/metrics/trend/:type
router.get('/trend/:type', (req, res) => {
  const { type } = req.params;
  const rows = db.prepare(`
    SELECT date, value FROM health_metrics
    WHERE metric_type = ?
    ORDER BY date DESC
    LIMIT 30
  `).all(type);

  res.json(rows.reverse());
});

module.exports = router;
