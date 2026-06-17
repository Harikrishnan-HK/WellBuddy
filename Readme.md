# WellBuddy 🧘‍♂️

> Your personal wellness OS — local-first, AI-powered, Mac + iPhone.

---

## What it does

WellBuddy is a PWA (Progressive Web App) that pulls all your health data from Apple Health automatically and gives you a single unified dashboard for:

- 🏋️ Weight & body composition trends
- 😴 Sleep quality & HRV (recovery score)
- 🏃 Workout performance & activity
- 🧘 Meditation streaks & stress
- 😊 Mood & energy patterns
- 🥗 Nutrition overview
- 🤖 AI-powered weekly insights (Claude)

---

## Architecture

```
Apple Watch + iPhone Apps
         ↓ (Apple Health)
   Apple Shortcuts (9 PM daily)
         ↓ (POST JSON)
   Node.js + Express (port 3001)
         ↓
      SQLite DB (local)
         ↓
   React PWA (port 5173)
   ↙              ↘
Mac Browser     iPhone Safari
                (Add to Home Screen)
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd wellbuddy
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

### 3. Start the app

```bash
npm run start
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

### 4. Set up Apple Shortcuts

See `shortcuts/SHORTCUTS_SETUP.md` for the step-by-step guide to connect Apple Health → WellBuddy.

### 5. Install on iPhone

1. Find your Mac's IP: `System Settings → Wi-Fi → Details`
2. Open Safari on iPhone → `http://YOUR_MAC_IP:5173`
3. Tap Share → "Add to Home Screen"

---

## Tabs

| Tab       | Key Metrics                      |
| --------- | -------------------------------- |
| Today     | Daily snapshot, ring scores      |
| Body      | Weight trend, body composition   |
| Sleep     | Sleep hours, HRV, resting HR     |
| Fitness   | Workouts, steps, active calories |
| Mind      | Meditation, mood, energy         |
| Nutrition | Calories in/out, macros          |
| Insights  | AI weekly summary + chat         |

---

## Tech Stack

- **Backend:** Node.js, Express, SQLite (better-sqlite3)
- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **AI:** Anthropic Claude API (claude-sonnet-4-6)
- **Data:** Apple Health via Apple Shortcuts automation

---

## Build Phases

- [x] Phase 1 — Foundation (backend, DB, Today tab, PWA setup)
- [ ] Phase 2 — All remaining tabs
- [ ] Phase 3 — AI Insights tab + chat
- [ ] Phase 4 — iPhone polish + Shortcuts integration testing
