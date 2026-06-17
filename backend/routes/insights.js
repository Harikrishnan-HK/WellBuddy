const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateWeeklySummary, chatAboutHealth } = require('../services/claude');
const { getWeeklyAggregates } = require('../services/aggregator');

// GET /api/insights/weekly — get cached or generate fresh
router.get('/weekly', async (req, res) => {
  const monday = getMondayDate();

  const cached = db.prepare(`
    SELECT * FROM insights WHERE week_start = ? ORDER BY generated_at DESC LIMIT 1
  `).get(monday);

  if (cached) return res.json({ from_cache: true, ...cached });

  try {
    const data = getWeeklyAggregates();
    const summary = await generateWeeklySummary(data);

    db.prepare(`
      INSERT INTO insights (week_start, summary) VALUES (?, ?)
    `).run(monday, summary);

    res.json({ from_cache: false, week_start: monday, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/insights/chat
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const data = getWeeklyAggregates();
    const reply = await chatAboutHealth(message, data);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getMondayDate() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

module.exports = router;
