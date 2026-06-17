import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';

export default function Sleep() {
  const [today, setToday] = useState(null);
  const [sleepTrend, setSleepTrend] = useState([]);
  const [hrvTrend, setHrvTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getToday(),
      api.getTrend('sleep_hours'),
      api.getTrend('hrv'),
    ])
      .then(([t, sl, hr]) => { setToday(t); setSleepTrend(sl); setHrvTrend(hr); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const m = today?.metrics || {};
  const sleep = m.sleep_hours?.value;
  const deep = m.sleep_deep_hours?.value;
  const rem = m.sleep_rem_hours?.value;
  const hrv = m.hrv?.value;
  const rhr = m.resting_heart_rate?.value;

  const sleepScore = sleep ? Math.min(Math.round((sleep / 8) * 100), 100) : null;
  const avgHrv = hrvTrend.length > 0
    ? Math.round(hrvTrend.reduce((s, r) => s + r.value, 0) / hrvTrend.length)
    : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Sleep</h1>
        <p className="text-sm text-slate-400">Recovery & HRV</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon="🌙" label="Sleep" value={sleep ? sleep.toFixed(1) : null} unit="hrs" color="text-cyan-400" />
        <MetricCard icon="🧠" label="Sleep Score" value={sleepScore} unit="/ 100" color="text-indigo-400" />
        <MetricCard icon="💤" label="Deep Sleep" value={deep ? deep.toFixed(1) : null} unit="hrs" color="text-blue-400" />
        <MetricCard icon="🌀" label="REM Sleep" value={rem ? rem.toFixed(1) : null} unit="hrs" color="text-violet-400" />
        <MetricCard icon="💓" label="HRV" value={hrv ? Math.round(hrv) : null} unit="ms" sub={avgHrv ? `30d avg ${avgHrv} ms` : undefined} color="text-rose-400" />
        <MetricCard icon="❤️" label="Resting HR" value={rhr ? Math.round(rhr) : null} unit="bpm" color="text-pink-400" />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4 space-y-4">
        <TrendChart data={sleepTrend} dataKey="value" type="bar" color="#22d3ee" label="Sleep hours (30 days)" />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <TrendChart data={hrvTrend} dataKey="value" type="line" color="#f43f5e" label="HRV trend (ms)" />
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
