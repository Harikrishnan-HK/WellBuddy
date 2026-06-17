# WellBuddy — Personal Wellness PWA

## Master Context for Claude Code

---

## What is WellBuddy?

A **local-first Personal Wellness PWA** (Progressive Web App) — similar in spirit to FinBuddy (a personal finance tracker) but for physical and mental wellness. It runs on a MacBook as a Node.js backend with a React frontend that is installable on iPhone via Safari "Add to Home Screen".

**Core philosophy:** Zero manual logging. All data flows automatically from Apple Health / Apple Watch via Apple Shortcuts → local backend.

---

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Backend       | Node.js + Express                           |
| Database      | SQLite (via `better-sqlite3`)               |
| Frontend      | React + Vite + Tailwind CSS                 |
| Charts        | Recharts                                    |
| AI Insights   | Anthropic Claude API (`claude-sonnet-4-6`)  |
| Health Data   | Apple Shortcuts → JSON → local API endpoint |
| iPhone Access | PWA via Safari (Add to Home Screen)         |
| Mac Access    | Browser at `http://localhost:5173`          |

---

## Project Folder Structure

```
wellbuddy/
├── backend/
│   ├── server.js              # Express server, main entry point
│   ├── db.js                  # SQLite setup and schema
│   ├── routes/
│   │   ├── health.js          # POST /api/health/sync (Apple Shortcuts webhook)
│   │   ├── metrics.js         # GET /api/metrics/* (dashboard data)
│   │   ├── mood.js            # POST/GET /api/mood (manual mood/energy log)
│   │   └── insights.js        # GET /api/insights (Claude AI weekly summary)
│   └── services/
│       ├── claude.js          # Anthropic API calls for AI insights
│       └── aggregator.js      # Data aggregation logic (weekly rollups, scores)
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # PWA manifest (icon, name, theme)
│   │   └── sw.js              # Service Worker (offline support)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx            # Tab routing
│   │   ├── tabs/
│   │   │   ├── Today.jsx      # Tab 1: Daily snapshot
│   │   │   ├── Body.jsx       # Tab 2: Weight & body composition
│   │   │   ├── Sleep.jsx      # Tab 3: Sleep & HRV
│   │   │   ├── Fitness.jsx    # Tab 4: Workouts & activity
│   │   │   ├── Mind.jsx       # Tab 5: Meditation & mood
│   │   │   ├── Nutrition.jsx  # Tab 6: Calories & macros
│   │   │   └── Insights.jsx   # Tab 7: AI weekly insights + chat
│   │   ├── components/
│   │   │   ├── RingScore.jsx  # Circular progress ring component
│   │   │   ├── MetricCard.jsx # Reusable metric display card
│   │   │   ├── TrendChart.jsx # Reusable Recharts line/bar chart
│   │   │   └── NavBar.jsx     # Bottom nav bar (mobile-style)
│   │   └── api/
│   │       └── client.js      # Frontend API calls to backend
│   ├── index.html
│   └── vite.config.js         # Proxy to backend on port 3001
├── shortcuts/
│   └── SHORTCUTS_SETUP.md     # How to set up Apple Shortcuts on iPhone
├── .env                       # ANTHROPIC_API_KEY, PORT
├── package.json               # Root scripts
└── README.md
```

---

## Database Schema (SQLite)

```sql
-- Raw health syncs from Apple Shortcuts
CREATE TABLE health_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,              -- YYYY-MM-DD
  metric_type TEXT NOT NULL,       -- 'steps', 'hrv', 'sleep_hours', etc.
  value REAL NOT NULL,
  unit TEXT,                       -- 'count', 'ms', 'hours', 'kcal', etc.
  source TEXT DEFAULT 'apple_health',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Workout sessions
CREATE TABLE workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  workout_type TEXT,               -- 'Running', 'Strength', 'Yoga', etc.
  duration_minutes REAL,
  calories_burned REAL,
  avg_heart_rate REAL,
  source TEXT DEFAULT 'apple_watch'
);

-- Manual mood & energy (only manual input needed)
CREATE TABLE mood_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  time TEXT,                       -- HH:MM
  mood INTEGER CHECK(mood BETWEEN 1 AND 5),
  energy INTEGER CHECK(energy BETWEEN 1 AND 5),
  note TEXT
);

-- Meditation sessions (from Insight Timer via HealthKit)
CREATE TABLE meditation_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  duration_minutes REAL,
  source TEXT DEFAULT 'insight_timer'
);

-- AI-generated weekly insights (cached)
CREATE TABLE insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,        -- YYYY-MM-DD (Monday)
  summary TEXT,                    -- Full AI-generated text
  generated_at TEXT DEFAULT (datetime('now'))
);
```

---

## API Endpoints

### Backend (Express on port 3001)

| Method | Route                      | Description                         |
| ------ | -------------------------- | ----------------------------------- |
| POST   | `/api/health/sync`         | Receives JSON from Apple Shortcuts  |
| GET    | `/api/metrics/today`       | Today's snapshot for dashboard      |
| GET    | `/api/metrics/week`        | Last 7 days aggregated              |
| GET    | `/api/metrics/trend/:type` | 30-day trend for a metric type      |
| POST   | `/api/mood`                | Log mood + energy                   |
| GET    | `/api/mood/week`           | This week's mood logs               |
| GET    | `/api/insights/weekly`     | Get (or generate) weekly AI summary |
| POST   | `/api/insights/chat`       | AI chat about your health data      |

### Apple Shortcuts Webhook Payload Format

```json
{
  "date": "2026-06-17",
  "steps": 8432,
  "hrv": 54.3,
  "resting_heart_rate": 62,
  "sleep_hours": 7.2,
  "sleep_deep_hours": 1.4,
  "sleep_rem_hours": 1.8,
  "active_calories": 420,
  "mindful_minutes": 20,
  "weight_kg": 72.5,
  "workouts": [
    {
      "type": "Strength Training",
      "duration_minutes": 55,
      "calories": 310,
      "avg_heart_rate": 138
    }
  ]
}
```

---

## PWA Setup (manifest.json)

```json
{
  "name": "WellBuddy",
  "short_name": "WellBuddy",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## iPhone Access Setup

1. Mac and iPhone must be on the **same Wi-Fi network**
2. Find Mac's local IP: `System Settings → Wi-Fi → Details → IP Address` (e.g. `192.168.1.10`)
3. Open Safari on iPhone → go to `http://192.168.1.10:5173`
4. Tap Share → "Add to Home Screen" → Done
5. WellBuddy now appears as an app icon on iPhone

---

## Apple Shortcuts Setup (Health Data Pipeline)

The Shortcut runs **daily at 9 PM** and does:

1. Reads from Apple Health: steps, HRV, sleep, resting HR, active calories, mindful minutes, weight
2. Reads workouts from the day
3. Formats as JSON
4. Sends POST request to `http://192.168.1.10:3001/api/health/sync`

See `shortcuts/SHORTCUTS_SETUP.md` for step-by-step setup.

---

## AI Insights (Claude API)

Weekly insight prompt includes:

- 7-day average of all metrics
- Mood & energy trend
- Workout frequency + types
- Sleep quality pattern
- Meditation consistency
- HRV trend (recovery indicator)

Claude returns:

- Overall wellness summary
- Top 3 observations (correlations, patterns)
- 2–3 actionable nudges for next week

---

## Environment Variables (.env)

```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
DB_PATH=./wellbuddy.db
```

---

## Build & Run

```bash
# Install all dependencies
npm install

# Start backend (port 3001)
npm run server

# Start frontend (port 5173)
npm run dev

# Both together
npm run start
```

---

## Key Design Principles

1. **Local-first** — all data stays on your Mac, no cloud sync
2. **Zero manual logging** — only mood/energy needs a tap
3. **Mobile-first UI** — bottom nav bar, card layout, works on iPhone Safari
4. **Modular tabs** — each tab is an independent React component
5. **FinBuddy-style** — same architecture pattern, familiar codebase structure
