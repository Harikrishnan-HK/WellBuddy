import React, { useCallback } from 'react';
import { api } from '../api/client';
import { useRefresh } from '../hooks/useRefresh';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import RefreshBtn from '../components/RefreshBtn';

const MOOD_LABELS = ['','😞 Rough','😕 Low','😐 Okay','🙂 Good','😄 Great'];
const ENERGY_LABELS = ['','🪫 Drained','😴 Tired','⚡ Decent','🔋 Energised','🚀 Wired'];

export default function Mind() {
  const fetch = useCallback(() => Promise.all([api.getToday(), api.getMoodWeek(), api.getTrend('mindful_minutes')]), []);
  const { data: raw, loading, refreshing, refresh } = useRefresh(fetch);
  const [today, moodWeek, medTrend] = raw || [null, [], []];

  if (loading) return <Spinner />;

  const m = today?.metrics || {};
  const medToday = today?.meditation_minutes || m.mindful_minutes?.value || 0;
  const moodLog = today?.mood;
  const avgMood = moodWeek?.length > 0 ? (moodWeek.reduce((s, r) => s + r.mood, 0) / moodWeek.length).toFixed(1) : null;
  const avgEnergy = moodWeek?.length > 0 ? (moodWeek.reduce((s, r) => s + r.energy, 0) / moodWeek.length).toFixed(1) : null;
  const totalMedWeek = medTrend?.slice(-7).reduce((s, r) => s + r.value, 0) || 0;
  const medStreak = calcStreak(medTrend);
  const moodChartData = moodWeek?.map(r => ({ date: r.date, mood: r.mood, energy: r.energy })) || [];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mind</h1>
          <p className="text-sm text-slate-400">Meditation & mood</p>
        </div>
        <RefreshBtn refreshing={refreshing} onRefresh={refresh} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon="🧘" label="Meditation Today" value={medToday ? Math.round(medToday) : null} unit="min" color="text-violet-400" />
        <MetricCard icon="🔥" label="Streak" value={medStreak || null} unit="days" sub="consecutive meditation days" color="text-orange-400" />
        <MetricCard icon="😊" label="Today's Mood" value={moodLog ? MOOD_LABELS[moodLog.mood] : null} color="text-yellow-400" />
        <MetricCard icon="⚡" label="Today's Energy" value={moodLog ? ENERGY_LABELS[moodLog.energy] : null} color="text-cyan-400" />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">This Week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xl font-bold text-violet-400">{Math.round(totalMedWeek)}</p><p className="text-xs text-slate-400">med min</p></div>
          <div><p className="text-xl font-bold text-yellow-400">{avgMood || '—'}</p><p className="text-xs text-slate-400">avg mood</p></div>
          <div><p className="text-xl font-bold text-cyan-400">{avgEnergy || '—'}</p><p className="text-xs text-slate-400">avg energy</p></div>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <TrendChart data={medTrend} dataKey="value" type="bar" color="#a78bfa" label="Meditation minutes (30 days)" />
      </div>

      {moodChartData.length > 0 && (
        <div className="bg-[#1e293b] rounded-2xl p-4">
          <TrendChart data={moodChartData} dataKey="mood" type="line" color="#facc15" label="Mood this week (1–5)" />
        </div>
      )}

      {moodWeek?.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Mood Log</p>
          {[...moodWeek].reverse().slice(0, 7).map((r, i) => (
            <div key={i} className="bg-[#1e293b] rounded-2xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{r.date}{r.time && ` · ${r.time}`}</p>
                {r.note && <p className="text-xs text-slate-300 mt-0.5 italic">"{r.note}"</p>}
              </div>
              <div className="flex gap-3 text-sm">
                <span>{['','😞','😕','😐','🙂','😄'][r.mood]}</span>
                <span>{['','🪫','😴','⚡','🔋','🚀'][r.energy]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function calcStreak(trend) {
  if (!trend?.length) return 0;
  const dateSet = new Set(trend.filter(r => r.value > 0).map(r => r.date));
  let streak = 0, d = new Date();
  while (true) {
    if (dateSet.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); } else break;
  }
  return streak;
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;
}
