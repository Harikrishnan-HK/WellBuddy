# Apple Shortcuts Setup — WellBuddy Health Sync

## Overview

This Shortcut runs **daily at 9 PM** and sends your Apple Health data to WellBuddy automatically.

## Prerequisites

1. Mac and iPhone on the **same Wi-Fi network**
2. WellBuddy backend running on your Mac (`npm run server`)
3. Find your Mac's local IP: **System Settings → Wi-Fi → Details → IP Address** (e.g. `192.168.1.10`)

---

## Build the Shortcut (step by step)

### Step 1 — Create a new Shortcut on iPhone

Open the **Shortcuts** app → tap **+** → name it `WellBuddy Sync`

### Step 2 — Add Health actions

Add each of these **"Get Health Samples"** actions:

| Metric | Health Category | Aggregation |
|--------|----------------|-------------|
| Steps | Steps | Sum |
| HRV | Heart Rate Variability | Average |
| Resting Heart Rate | Resting Heart Rate | Average |
| Sleep | Time in Bed | Sum |
| Active Calories | Active Energy | Sum |
| Mindful Minutes | Mindful Minutes | Sum |
| Weight | Body Mass | Latest |

For each: set **Start Date** = Today's start (00:00), **End Date** = Now

### Step 3 — Get Workouts

Add a **"Find Health Samples"** for **Workouts**, filtered by: Date is today

### Step 4 — Build the JSON dictionary

Add a **"Dictionary"** action with these key-value pairs:

```
date         → Date (formatted as "yyyy-MM-dd")
steps        → Steps result
hrv          → HRV result
resting_heart_rate → Resting HR result
sleep_hours  → Sleep result (convert minutes → hours by dividing by 60)
active_calories → Active Calories result
mindful_minutes → Mindful Minutes result
weight_kg    → Weight result (convert lbs → kg: divide by 2.205)
workouts     → [list of workout dicts, see below]
```

For each workout, create a dictionary with:
```
type              → Workout Activity Type
duration_minutes  → Duration (seconds ÷ 60)
calories          → Active Energy Burned
avg_heart_rate    → Average Heart Rate
```

### Step 5 — Send to WellBuddy

Add a **"Get Contents of URL"** action:
- URL: `http://192.168.1.10:3001/api/health/sync` ← replace with your Mac's IP
- Method: **POST**
- Request Body: **JSON**
- Body: the Dictionary from Step 4

### Step 6 — Automate

Go to **Automation** tab → **+** → **Time of Day**:
- Time: **9:00 PM**
- Repeat: **Daily**
- Run Immediately: ✓ (disable "Ask Before Running")
- Action: **Run Shortcut** → select `WellBuddy Sync`

---

## Testing

To test manually: open the Shortcut and tap ▶ Run

You can verify it worked by checking `GET http://localhost:3001/api/metrics/today` on your Mac.
