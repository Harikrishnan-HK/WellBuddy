import React, { useCallback, useState } from 'react';
import { api } from '../api/client';
import { useRefresh } from '../hooks/useRefresh';
import MetricCard from '../components/MetricCard';
import RingScore from '../components/RingScore';
import Icon from '../components/Icon';

const MOOD_LABELS   = ['', '😞', '😕', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['', '🪫', '😴', '⚡', '🔋', '🚀'];

const QUOTES = [
  "Small steps every day.",
  "Rest is part of progress.",
  "Your body hears everything your mind says.",
  "Consistency beats perfection.",
  "One good decision at a time.",
  "Be kind to yourself today.",
  "Progress, not perfection.",
  "What you do daily shapes who you become.",
  "Gratitude turns what we have into enough.",
  "Take care of your body — it's the only place you live.",
  "Today is a fresh start.",
  "Energy flows where attention goes.",
  "Strong mind, strong body.",
  "Breathe. You're doing better than you think.",
  "Every effort counts, even the quiet ones.",
  "Nourish to flourish.",
  "Your future self will thank you.",
  "Health is a daily practice.",
  "A little better every day.",
  "You have everything you need right now.",
  "Move, rest, repeat.",
  "Kindness starts with yourself.",
  "Choose progress over perfection.",
  "Celebrate the small wins.",
  "The best time to start is now.",
  "Your habits are your future.",
  "Rest well, live well.",
  "Do less, but better.",
  "Show up for yourself.",
  "Growth happens outside comfort zones.",
];

function dailyQuote() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length];
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function calcScores(metrics, meditation, workouts) {
  const steps    = metrics.steps?.value || 0;
  const sleep    = metrics.sleep_hours?.value || 0;
  const hrv      = metrics.hrv?.value || 0;
  const calories = metrics.active_calories?.value || 0;
  const activityScore = Math.min((steps / 10000) * 40 + (calories / 500) * 30 + (workouts.length > 0 ? 30 : 0), 100);
  const sleepScore    = Math.min((sleep / 8) * 70 + (hrv / 80) * 30, 100);
  const mindScore     = Math.min((meditation / 20) * 100, 100);
  return { activity: Math.round(activityScore), sleep: Math.round(sleepScore), mind: Math.round(mindScore) };
}

export default function Today({ onNavigate }) {
  const fetchToday = useCallback(() => api.getToday(), []);
  const { data, loading, refreshing, lastUpdated, refresh } = useRefresh(fetchToday);

  const [showMoodSheet, setShowMoodSheet] = useState(false);
  const [mood,   setMood]   = useState(3);
  const [energy, setEnergy] = useState(3);
  const [note,   setNote]   = useState('');
  const [moodSaving, setMoodSaving] = useState(false);

  const saveMood = async () => {
    setMoodSaving(true);
    await api.postMood({ mood, energy, note });
    setMoodSaving(false);
    setShowMoodSheet(false);
    setNote('');
    refresh();
  };

  const handleSync = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = `shortcuts://run-shortcut?name=WellBuddy%20Sync&x-success=${returnUrl}`;
    setTimeout(refresh, 10000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#F95C4B', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const m        = data?.metrics || {};
  const workouts = data?.workouts || [];
  const medMin   = data?.meditation_minutes || m.mindful_minutes?.value || 0;
  const moodLog  = data?.mood;
  const scores   = calcScores(m, medMin, workouts);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="px-4 pb-4 space-y-5" style={{ paddingTop: 'max(env(safe-area-inset-top), 1.5rem)' }}>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#000000' }}>{greeting()}, Hk</h1>
          <p className="text-sm" style={{ color: '#6B6862' }}>{todayLabel}</p>
        </div>
        <button
          onClick={handleSync}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold active:opacity-70 mt-1"
          style={{ background: '#F95C4B', color: '#F6F4F1' }}
        >
          <Icon name="refresh" size={13} className={refreshing ? 'animate-spin' : ''} />
          Sync
        </button>
      </div>

      {/* Updated time + weight shortcut */}
      <div className="flex items-center justify-between -mt-3">
        <p className="text-[11px]" style={{ color: '#E4DED2' }}>
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : ' '}
        </p>
        <button
          onClick={() => onNavigate?.('Health')}
          className="flex items-center gap-1.5 active:opacity-60"
          style={{ color: '#9C988F' }}
        >
          <Icon name="weight" size={13} />
          <span className="text-[11px]">{m.weight_kg ? `${m.weight_kg.value.toFixed(1)} kg` : 'Log weight'}</span>
        </button>
      </div>

      {/* Ring Scores */}
      <div className="rounded-2xl p-4" style={{ background: '#FFFFFF' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-4" style={{ color: '#6B6862' }}>Today's Scores</p>
        <div className="flex justify-around">
          <RingScore label="Activity" value={scores.activity} color="#F95C4B" />
          <RingScore label="Sleep"    value={scores.sleep}    color="#D9483A" />
          <RingScore label="Mind"     value={scores.mind}     color="#C4956A" />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6862' }}>Metrics</p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            icon={<Icon name="stairs" size={18} />}
            label="Steps"
            value={m.steps ? m.steps.value.toLocaleString() : null} unit="steps"
            sub={m.steps ? `${Math.round((m.steps.value / 10000) * 100)}% of goal` : 'No data'}
            onClick={() => onNavigate?.('Health', 'Fitness')} />
          <MetricCard
            icon={<Icon name="moon" size={18} />}
            label="Sleep"
            value={m.sleep_hours ? m.sleep_hours.value.toFixed(1) : null} unit="hrs"
            sub={m.sleep_deep_hours ? `${m.sleep_deep_hours.value.toFixed(1)}h deep` : undefined}
            onClick={() => onNavigate?.('Health', 'Sleep')} />
          <MetricCard
            icon={<Icon name="heart" size={18} />}
            label="HRV"
            value={m.hrv ? Math.round(m.hrv.value) : null} unit="ms"
            sub={m.resting_heart_rate ? `RHR ${Math.round(m.resting_heart_rate.value)} bpm` : undefined}
            onClick={() => onNavigate?.('Health', 'Sleep')} />
          <MetricCard
            icon={<Icon name="flame" size={18} />}
            label="Active Cal"
            value={m.active_calories ? Math.round(m.active_calories.value) : null} unit="kcal"
            onClick={() => onNavigate?.('Health', 'Fitness')} />
          <MetricCard
            icon={<Icon name="lotus" size={18} />}
            label="Meditation"
            value={medMin ? Math.round(medMin) : null} unit="min"
            onClick={() => onNavigate?.('Mind', 'Meditation')} />
          <MetricCard
            icon={<Icon name="message" size={18} />}
            label="Mood"
            value={moodLog ? MOOD_LABELS[moodLog.mood] : null}
            sub={moodLog ? `Energy ${ENERGY_LABELS[moodLog.energy]}` : 'Tap to log'}
            onClick={() => {
              if (moodLog) { setMood(moodLog.mood); setEnergy(moodLog.energy); }
              setShowMoodSheet(true);
            }} />
        </div>
      </div>

      {/* Workouts */}
      {workouts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#6B6862' }}>Today's Workouts</p>
          {workouts.map((w, i) => (
            <div key={i} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#FFFFFF' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#F6F4F1', color: '#F95C4B' }}>
                <Icon name="bolt" size={16} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: '#000000' }}>{w.workout_type}</p>
                <p className="text-xs" style={{ color: '#6B6862' }}>
                  {w.duration_minutes ? `${Math.round(w.duration_minutes)} min` : ''}
                  {w.calories_burned  ? ` · ${Math.round(w.calories_burned)} kcal` : ''}
                  {w.avg_heart_rate   ? ` · ${Math.round(w.avg_heart_rate)} bpm avg` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {Object.keys(m).length === 0 && (
        <div className="rounded-2xl p-4 border border-dashed text-center" style={{ background: '#FFFFFF', borderColor: '#E4DED2' }}>
          <p className="text-sm" style={{ color: '#6B6862' }}>No health data synced yet.</p>
          <p className="text-xs mt-1" style={{ color: '#9C988F' }}>Tap Sync to pull from Apple Health.</p>
        </div>
      )}

      {/* Daily quote */}
      <p className="text-center text-[11px] italic px-6 pb-1" style={{ color: '#E4DED2' }}>
        "{dailyQuote()}"
      </p>

      {/* Mood bottom sheet */}
      {showMoodSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ maxWidth: 430, margin: '0 auto' }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMoodSheet(false)} />
          <div className="relative rounded-t-3xl p-5 space-y-5" style={{ background: '#F6F4F1', paddingBottom: 'calc(max(env(safe-area-inset-bottom), 8px) + 72px)' }}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: '#E4DED2' }} />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#000000' }}>How are you feeling?</h2>
              <button onClick={() => setShowMoodSheet(false)} className="text-sm" style={{ color: '#9C988F' }}>Cancel</button>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6862' }}>Mood</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setMood(v)}
                    className="flex-1 text-2xl py-2 rounded-2xl transition-all"
                    style={{ background: mood === v ? '#F95C4B' : '#FFFFFF', transform: mood === v ? 'scale(1.1)' : 'scale(1)' }}>
                    {MOOD_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#6B6862' }}>Energy</p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(v => (
                  <button key={v} onClick={() => setEnergy(v)}
                    className="flex-1 text-2xl py-2 rounded-2xl transition-all"
                    style={{ background: energy === v ? '#D9483A' : '#FFFFFF', transform: energy === v ? 'scale(1.1)' : 'scale(1)' }}>
                    {ENERGY_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Add a note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full rounded-2xl px-4 py-3 text-sm outline-none"
              style={{ background: '#FFFFFF', color: '#000000', border: '1px solid #E4DED2' }}
            />

            <button
              onClick={saveMood}
              disabled={moodSaving}
              className="w-full py-3.5 rounded-2xl text-sm font-bold disabled:opacity-50 active:opacity-80"
              style={{ background: '#F95C4B', color: '#F6F4F1' }}
            >
              {moodSaving ? 'Saving…' : moodLog ? 'Update mood' : 'Save mood'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
