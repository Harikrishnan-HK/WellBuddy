const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/health/sync — receives JSON from Apple Shortcuts
router.post('/sync', (req, res) => {
  const body = req.body;
  const date = body.date || new Date().toISOString().slice(0, 10);

  const metricFields = [
    { key: 'steps', unit: 'count' },
    { key: 'hrv', unit: 'ms' },
    { key: 'resting_heart_rate', unit: 'bpm' },
    { key: 'sleep_hours', unit: 'hours' },
    { key: 'sleep_deep_hours', unit: 'hours' },
    { key: 'sleep_rem_hours', unit: 'hours' },
    { key: 'active_calories', unit: 'kcal' },
    { key: 'mindful_minutes', unit: 'minutes' },
    { key: 'weight_kg', unit: 'kg' },
  ];

  const upsertMetric = db.prepare(`
    INSERT INTO health_metrics (date, metric_type, value, unit)
    VALUES (@date, @metric_type, @value, @unit)
    ON CONFLICT DO NOTHING
  `);

  const insertMany = db.transaction((metrics) => {
    for (const m of metrics) upsertMetric.run(m);
  });

  const metricsToInsert = metricFields
    .filter(({ key }) => body[key] != null)
    .map(({ key, unit }) => ({ date, metric_type: key, value: body[key], unit }));

  insertMany(metricsToInsert);

  // Workouts
  if (Array.isArray(body.workouts)) {
    const insertWorkout = db.prepare(`
      INSERT INTO workouts (date, workout_type, duration_minutes, calories_burned, avg_heart_rate)
      VALUES (@date, @workout_type, @duration_minutes, @calories_burned, @avg_heart_rate)
    `);
    const insertWorkouts = db.transaction((workouts) => {
      for (const w of workouts) {
        insertWorkout.run({
          date,
          workout_type: w.type || null,
          duration_minutes: w.duration_minutes || null,
          calories_burned: w.calories || null,
          avg_heart_rate: w.avg_heart_rate || null,
        });
      }
    });
    insertWorkouts(body.workouts);
  }

  // Meditation (mindful_minutes → meditation_sessions)
  if (body.mindful_minutes != null && body.mindful_minutes > 0) {
    db.prepare(`
      INSERT INTO meditation_sessions (date, duration_minutes)
      VALUES (?, ?)
    `).run(date, body.mindful_minutes);
  }

  res.json({ ok: true, date, metrics: metricsToInsert.length });
});

module.exports = router;
