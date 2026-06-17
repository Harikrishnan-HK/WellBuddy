import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from 'recharts';

const TDEE_ESTIMATE = 2200; // resting + activity baseline estimate

export default function Nutrition() {
  const [today, setToday] = useState(null);
  const [calTrend, setCalTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getToday(), api.getTrend('active_calories')])
      .then(([t, ct]) => { setToday(t); setCalTrend(ct); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const m = today?.metrics || {};
  const activeCal = m.active_calories?.value || 0;
  const weight = m.weight_kg?.value;

  // Estimate burn: BMR rough estimate + active calories
  const bmr = weight ? Math.round(weight * 22) : 1600;
  const totalBurn = Math.round(bmr + activeCal);
  const burnPct = Math.min(Math.round((totalBurn / TDEE_ESTIMATE) * 100), 120);

  const avg7dCal = calTrend.slice(-7).length > 0
    ? Math.round(calTrend.slice(-7).reduce((s, r) => s + r.value, 0) / calTrend.slice(-7).length)
    : null;

  const radialData = [
    { name: 'Active Cal', value: burnPct, fill: '#f97316' },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Nutrition</h1>
        <p className="text-sm text-slate-400">Calorie burn & energy balance</p>
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-3">Today's Energy Burn</p>
        <div className="flex items-center gap-4">
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="65%" outerRadius="90%"
                startAngle={90} endAngle={-270}
                data={radialData}
              >
                <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#334155' }} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-slate-400">Active burn</p>
              <p className="text-xl font-bold text-orange-400">{activeCal ? Math.round(activeCal) : '—'} <span className="text-sm font-normal text-slate-400">kcal</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Est. total burn</p>
              <p className="text-xl font-bold text-slate-100">{activeCal ? totalBurn : '—'} <span className="text-sm font-normal text-slate-400">kcal</span></p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          icon="🔥" label="Active Cal"
          value={activeCal ? Math.round(activeCal) : null}
          unit="kcal"
          color="text-orange-400"
        />
        <MetricCard
          icon="📊" label="7-day Avg"
          value={avg7dCal}
          unit="kcal"
          sub="active cal average"
          color="text-amber-400"
        />
        <MetricCard
          icon="🧮" label="Est. BMR"
          value={bmr}
          unit="kcal/day"
          sub={weight ? `based on ${weight}kg` : 'default estimate'}
          color="text-slate-400"
        />
        <MetricCard
          icon="⚖️" label="Weight"
          value={weight ? weight.toFixed(1) : null}
          unit="kg"
          color="text-emerald-400"
        />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <TrendChart data={calTrend} dataKey="value" type="bar" color="#f97316" label="Active calories burned (30 days)" />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4 border border-slate-700">
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">Note</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Calorie intake tracking requires a nutrition app (e.g. MyFitnessPal) that syncs to Apple Health.
          This tab shows <span className="text-slate-300">calorie burn</span> from Apple Watch.
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
