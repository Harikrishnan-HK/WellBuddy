const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/habits — all active habits
router.get('/', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits WHERE active = 1 ORDER BY sort_order, id').all();
  res.json(habits);
});

// POST /api/habits — create habit
router.post('/', (req, res) => {
  const { name, emoji, color, goal_type, goal_value, frequency, time_range } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = db.prepare(`
    INSERT INTO habits (name, emoji, color, goal_type, goal_value, frequency, time_range)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    emoji || '⭐',
    color || '#6366f1',
    goal_type || 'boolean',
    goal_value || 1,
    frequency || 'daily',
    time_range || 'anytime'
  );
  const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(result.lastInsertRowid);
  res.json(habit);
});

// PUT /api/habits/:id — update habit
router.put('/:id', (req, res) => {
  const { name, emoji, color, goal_type, goal_value, frequency, time_range, sort_order } = req.body;
  db.prepare(`
    UPDATE habits SET
      name = COALESCE(?, name),
      emoji = COALESCE(?, emoji),
      color = COALESCE(?, color),
      goal_type = COALESCE(?, goal_type),
      goal_value = COALESCE(?, goal_value),
      frequency = COALESCE(?, frequency),
      time_range = COALESCE(?, time_range),
      sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(name ?? null, emoji ?? null, color ?? null, goal_type ?? null, goal_value ?? null,
         frequency ?? null, time_range ?? null, sort_order ?? null, req.params.id);
  res.json(db.prepare('SELECT * FROM habits WHERE id = ?').get(req.params.id));
});

// DELETE /api/habits/:id — soft delete
router.delete('/:id', (req, res) => {
  db.prepare('UPDATE habits SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST /api/habits/reorder
router.post('/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'order array required' });
  const update = db.prepare('UPDATE habits SET sort_order = ? WHERE id = ?');
  const tx = db.transaction((items) => { for (const item of items) update.run(item.sort_order, item.id); });
  tx(order);
  res.json({ ok: true });
});

// GET /api/habits/logs?date=YYYY-MM-DD — logs for a given date (default today)
router.get('/logs', (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const logs = db.prepare('SELECT * FROM habit_logs WHERE date = ?').all(date);
  res.json(logs);
});

// GET /api/habits/logs/range?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/logs/range', (req, res) => {
  const to   = req.query.to   || new Date().toISOString().slice(0, 10);
  const from = req.query.from || (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();
  const logs = db.prepare('SELECT * FROM habit_logs WHERE date BETWEEN ? AND ?').all(from, to);
  res.json(logs);
});

// POST /api/habits/log — toggle or set value for a habit on a date
router.post('/log', (req, res) => {
  const { habit_id, date, value } = req.body;
  if (!habit_id) return res.status(400).json({ error: 'habit_id required' });
  const day = date || new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT * FROM habit_logs WHERE habit_id = ? AND date = ?').get(habit_id, day);

  if (existing) {
    // Toggle off if value same, otherwise update
    if (value === undefined || value === existing.value) {
      db.prepare('DELETE FROM habit_logs WHERE habit_id = ? AND date = ?').run(habit_id, day);
      return res.json({ ok: true, action: 'removed', date: day });
    }
    db.prepare(`UPDATE habit_logs SET value = ?, logged_at = datetime('now') WHERE habit_id = ? AND date = ?`)
      .run(value, habit_id, day);
    return res.json({ ok: true, action: 'updated', date: day, value });
  }

  db.prepare('INSERT INTO habit_logs (habit_id, date, value) VALUES (?, ?, ?)').run(habit_id, day, value ?? 1);
  res.json({ ok: true, action: 'added', date: day, value: value ?? 1 });
});

// GET /api/habits/stats — streaks and completion rates per habit
router.get('/stats', (req, res) => {
  const habits = db.prepare('SELECT * FROM habits WHERE active = 1').all();
  const stats = habits.map(h => {
    const logs = db.prepare('SELECT date FROM habit_logs WHERE habit_id = ? ORDER BY date DESC').all(h.id);
    const dateSet = new Set(logs.map(l => l.date));

    // Current streak
    let streak = 0;
    const d = new Date();
    while (true) {
      const ds = d.toISOString().slice(0, 10);
      if (dateSet.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    // Best streak
    let best = 0, cur = 0;
    const sorted = [...dateSet].sort();
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { cur = 1; continue; }
      const prev = new Date(sorted[i - 1]);
      prev.setDate(prev.getDate() + 1);
      if (prev.toISOString().slice(0, 10) === sorted[i]) cur++;
      else cur = 1;
      if (cur > best) best = cur;
    }
    if (cur > best) best = cur;

    // Last 30 days completion rate
    const last30 = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const dd = new Date(now);
      dd.setDate(dd.getDate() - i);
      last30.push(dd.toISOString().slice(0, 10));
    }
    const completed30 = last30.filter(d => dateSet.has(d)).length;

    return { habit_id: h.id, streak, best_streak: Math.max(best, streak), completed_30: completed30, rate_30: Math.round((completed30 / 30) * 100) };
  });
  res.json(stats);
});

module.exports = router;
