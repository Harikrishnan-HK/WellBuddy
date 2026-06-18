import React, { useCallback } from 'react';
import { api } from '../api/client';
import { useRefresh } from '../hooks/useRefresh';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import RefreshBtn from '../components/RefreshBtn';

const WORKOUT_ICONS = { 'Running':'🏃','Strength Training':'🏋️','Yoga':'🧘','Cycling':'🚴','Swimming':'🏊','HIIT':'⚡','Walking':'🚶' };
const workoutIcon = (type) => WORKOUT_ICONS[type] || '🏅';

export default function Fitness() {
  const fetch = useCallback(() => Promise.all([api.getToday(), api.getWeek(), api.getTrend('steps'), api.getTrend('active_calories')]), []);
  const { data: raw, loading, refreshing, refresh } = useRefresh(fetch);
  const [today, week, stepsTrend, calTrend] = raw || [null, null, [], []];

  if (loading) return <Spinner />;

  const m = today?.metrics || {};
  const steps = m.steps?.value;
  const cal = m.active_calories?.value;
  const allWorkouts = week?.workouts || [];
  const weekCalories = allWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0);
  const weekMinutes = allWorkouts.reduce((s, w) => s + (w.duration_minutes || 0), 0);
  const avgSteps = stepsTrend?.length > 0
    ? Math.round(stepsTrend.reduce((s, r) => s + r.value, 0) / stepsTrend.length) : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Fitness</h1>
          <p className="text-sm text-slate-400">Activity & workouts</p>
        </div>
        <RefreshBtn refreshing={refreshing} onRefresh={refresh} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon="👣" label="Steps Today"
          value={steps ? steps.toLocaleString() : null} unit="steps"
          sub={steps ? `${Math.round((steps / 10000) * 100)}% of 10k goal` : undefined}
          color="text-indigo-400" />
        <MetricCard icon="🔥" label="Active Cal"
          value={cal ? Math.round(cal) : null} unit="kcal" color="text-orange-400" />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">This Week</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div><p className="text-xl font-bold text-indigo-400">{allWorkouts.length}</p><p className="text-xs text-slate-400">Workouts</p></div>
          <div><p className="text-xl font-bold text-orange-400">{Math.round(weekCalories)}</p><p className="text-xs text-slate-400">kcal burned</p></div>
          <div><p className="text-xl font-bold text-cyan-400">{Math.round(weekMinutes)}</p><p className="text-xs text-slate-400">min active</p></div>
        </div>
      </div>

      {allWorkouts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Recent Workouts</p>
          {[...allWorkouts].reverse().slice(0, 5).map((w, i) => (
            <div key={i} className="bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl w-10 h-10 flex items-center justify-center bg-slate-800 rounded-xl">{workoutIcon(w.workout_type)}</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-100">{w.workout_type || 'Workout'}</p>
                <p className="text-xs text-slate-400">
                  {w.date}{w.duration_minutes ? ` · ${Math.round(w.duration_minutes)} min` : ''}{w.calories_burned ? ` · ${Math.round(w.calories_burned)} kcal` : ''}
                </p>
              </div>
              {w.avg_heart_rate && <div className="text-right"><p className="text-sm font-bold text-rose-400">{Math.round(w.avg_heart_rate)}</p><p className="text-[10px] text-slate-500">bpm avg</p></div>}
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <TrendChart data={stepsTrend} dataKey="value" type="bar" color="#6366f1"
          label={`Steps (30 days)${avgSteps ? ` · avg ${avgSteps.toLocaleString()}` : ''}`} />
      </div>
      <div className="bg-[#1e293b] rounded-2xl p-4">
        <TrendChart data={calTrend} dataKey="value" type="line" color="#f97316" label="Active calories (30 days)" />
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;
}
