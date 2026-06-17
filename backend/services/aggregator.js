const db = require('../db');

function getWeeklyAggregates() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  const placeholders = days.map(() => '?').join(',');

  const metrics = db.prepare(`
    SELECT metric_type, AVG(value) as avg, MIN(value) as min, MAX(value) as max
    FROM health_metrics
    WHERE date IN (${placeholders})
    GROUP BY metric_type
  `).all(...days);

  const workouts = db.prepare(`
    SELECT workout_type, COUNT(*) as count, SUM(duration_minutes) as total_minutes
    FROM workouts WHERE date IN (${placeholders})
    GROUP BY workout_type
  `).all(...days);

  const moods = db.prepare(`
    SELECT AVG(mood) as avg_mood, AVG(energy) as avg_energy FROM mood_logs
    WHERE date IN (${placeholders})
  `).get(...days);

  const meditation = db.prepare(`
    SELECT SUM(duration_minutes) as total, COUNT(*) as sessions
    FROM meditation_sessions WHERE date IN (${placeholders})
  `).get(...days);

  return { days, metrics, workouts, moods, meditation };
}

module.exports = { getWeeklyAggregates };
