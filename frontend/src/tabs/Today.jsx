import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';
import RingScore from '../components/RingScore';

const MOOD_LABELS = ['', '😞', '😕', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['', '🪫', '😴', '⚡', '🔋', '🚀'];

function calcScores(metrics, meditation, workouts) {
  const steps = metrics.steps?.value || 0;
  const sleep = metrics.sleep_hours?.value || 0;
  const hrv = metrics.hrv?.value || 0;
  const calories = metrics.active_calories?.value || 0;

  const activityScore = Math.min((steps / 10000) * 40 + (calories / 500) * 30 + (workouts.length > 0 ? 30 : 0), 100);
  const sleepScore = Math.min((sleep / 8) * 70 + (hrv / 80) * 30, 100);
  const mindScore = Math.min((meditation / 20) * 100, 100);

  return {
    activity: Math.round(activityScore),
    sleep: Math.round(sleepScore),
    mind: Math.round(mindScore),
  };
}

export default function Today() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note, setNote] = useState('');
  const [moodSaved, setMoodSaved] = useState(false);
  const [showMoodForm, setShowMoodForm] = useState(false);

  useEffect(() => {
    api.getToday()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveMood = async () => {
    await api.postMood({ mood, energy, note });
    setMoodSaved(true);
    setShowMoodForm(false);
    const fresh = await api.getToday();
    setData(fresh);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const m = data?.metrics || {};
  const workouts = data?.workouts || [];
  const medMin = data?.meditation_minutes || m.mindful_minutes?.value || 0;
  const moodLog = data?.mood;

  const scores = calcScores(m, medMin, workouts);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Good {greeting()}</h1>
        <p className="text-sm text-slate-400">{todayLabel}</p>
      </div>

      {/* Ring Scores */}
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-4">Today's Scores</p>
        <div className="flex justify-around">
          <RingScore label="Activity" value={scores.activity} color="#6366f1" />
          <RingScore label="Sleep" value={scores.sleep} color="#22d3ee" />
          <RingScore label="Mind" value={scores.mind} color="#a78bfa" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Metrics</p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon="👣" label="Steps"
            value={m.steps ? m.steps.value.toLocaleString() : null}
            unit="steps"
            sub={m.steps ? `${Math.round((m.steps.value / 10000) * 100)}% of goal` : 'No data'}
            color="text-indigo-400"
          />
          <MetricCard
            icon="🌙" label="Sleep"
            value={m.sleep_hours ? m.sleep_hours.value.toFixed(1) : null}
            unit="hrs"
            sub={m.sleep_deep_hours ? `${m.sleep_deep_hours.value.toFixed(1)}h deep` : undefined}
            color="text-cyan-400"
          />
          <MetricCard
            icon="💓" label="HRV"
            value={m.hrv ? Math.round(m.hrv.value) : null}
            unit="ms"
            sub={m.resting_heart_rate ? `RHR ${Math.round(m.resting_heart_rate.value)} bpm` : undefined}
            color="text-rose-400"
          />
          <MetricCard
            icon="🔥" label="Active Cal"
            value={m.active_calories ? Math.round(m.active_calories.value) : null}
            unit="kcal"
            color="text-orange-400"
          />
          <MetricCard
            icon="🧘" label="Meditation"
            value={medMin ? Math.round(medMin) : null}
            unit="min"
            color="text-violet-400"
          />
          <MetricCard
            icon="😊" label="Mood"
            value={moodLog ? MOOD_LABELS[moodLog.mood] : null}
            sub={moodLog ? `Energy ${ENERGY_LABELS[moodLog.energy]}` : 'Log below'}
            color="text-yellow-400"
          />
        </div>
      </div>

      {/* Workouts */}
      {workouts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Today's Workouts</p>
          {workouts.map((w, i) => (
            <div key={i} className="bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">🏋️</span>
              <div>
                <p className="font-semibold text-slate-100 text-sm">{w.workout_type}</p>
                <p className="text-xs text-slate-400">
                  {w.duration_minutes ? `${Math.round(w.duration_minutes)} min` : ''}
                  {w.calories_burned ? ` · ${Math.round(w.calories_burned)} kcal` : ''}
                  {w.avg_heart_rate ? ` · ${Math.round(w.avg_heart_rate)} bpm avg` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mood Log */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Log Mood</p>
          {moodSaved && <span className="text-xs text-green-400">Saved ✓</span>}
        </div>

        {!showMoodForm && !moodSaved ? (
          <button
            onClick={() => setShowMoodForm(true)}
            className="w-full bg-[#1e293b] rounded-2xl p-4 text-sm text-slate-400 border border-dashed border-slate-600 hover:border-indigo-500 transition-colors"
          >
            + Log how you feel today
          </button>
        ) : showMoodForm ? (
          <div className="bg-[#1e293b] rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-2">Mood</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setMood(v)}
                    className={`flex-1 text-xl py-1 rounded-xl transition-all ${mood === v ? 'bg-indigo-600 scale-110' : 'bg-slate-700'}`}
                  >
                    {MOOD_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-2">Energy</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button
                    key={v}
                    onClick={() => setEnergy(v)}
                    className={`flex-1 text-xl py-1 rounded-xl transition-all ${energy === v ? 'bg-violet-600 scale-110' : 'bg-slate-700'}`}
                  >
                    {ENERGY_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none border border-slate-700 focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowMoodForm(false)}
                className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={saveMood}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
              >
                Save
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* No data hint */}
      {Object.keys(m).length === 0 && (
        <div className="bg-[#1e293b] rounded-2xl p-4 border border-dashed border-slate-600 text-center">
          <p className="text-sm text-slate-400">No health data synced yet.</p>
          <p className="text-xs text-slate-500 mt-1">Set up Apple Shortcuts to auto-sync from Apple Health.</p>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
