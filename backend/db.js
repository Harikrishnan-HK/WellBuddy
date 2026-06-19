const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DB_PATH = process.env.DB_PATH || './wellbuddy.db';
const db = new Database(path.resolve(DB_PATH));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS health_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    value REAL NOT NULL,
    unit TEXT,
    source TEXT DEFAULT 'apple_health',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    workout_type TEXT,
    duration_minutes REAL,
    calories_burned REAL,
    avg_heart_rate REAL,
    source TEXT DEFAULT 'apple_watch'
  );

  CREATE TABLE IF NOT EXISTS mood_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT,
    mood INTEGER CHECK(mood BETWEEN 1 AND 5),
    energy INTEGER CHECK(energy BETWEEN 1 AND 5),
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS meditation_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    duration_minutes REAL,
    source TEXT DEFAULT 'insight_timer'
  );

  CREATE TABLE IF NOT EXISTS insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL,
    summary TEXT,
    generated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weight_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    weight_kg REAL NOT NULL,
    logged_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS weight_goals (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    start_weight REAL,
    target_weight REAL,
    height_cm REAL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  INSERT OR IGNORE INTO weight_goals (id) VALUES (1);

  CREATE TABLE IF NOT EXISTS habits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '⭐',
    color TEXT DEFAULT '#6366f1',
    goal_type TEXT DEFAULT 'boolean',
    goal_value INTEGER DEFAULT 1,
    frequency TEXT DEFAULT 'daily',
    time_range TEXT DEFAULT 'anytime',
    active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS habit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    value INTEGER DEFAULT 1,
    logged_at TEXT DEFAULT (datetime('now')),
    UNIQUE(habit_id, date)
  );
`);

module.exports = db;
