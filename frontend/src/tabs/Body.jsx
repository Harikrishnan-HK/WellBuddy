import React, { useCallback } from 'react';
import { api } from '../api/client';
import { useRefresh } from '../hooks/useRefresh';
import MetricCard from '../components/MetricCard';
import TrendChart from '../components/TrendChart';
import RefreshBtn from '../components/RefreshBtn';

export default function Body() {
  const fetch = useCallback(() => Promise.all([api.getToday(), api.getTrend('weight_kg')]), []);
  const { data: raw, loading, refreshing, refresh } = useRefresh(fetch);
  const [today, trend] = raw || [null, []];

  if (loading) return <Spinner />;

  const m = today?.metrics || {};
  const weight = m.weight_kg?.value;
  const latest = trend?.length > 0 ? trend[trend.length - 1].value : null;
  const oldest = trend?.length > 1 ? trend[0].value : null;
  const change = latest && oldest ? (latest - oldest).toFixed(1) : null;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Body</h1>
          <p className="text-sm text-slate-400">Weight & composition</p>
        </div>
        <RefreshBtn refreshing={refreshing} onRefresh={refresh} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon="⚖️" label="Today's Weight"
          value={weight ? weight.toFixed(1) : null} unit="kg" color="text-emerald-400" />
        <MetricCard icon="📉" label="30-day Change"
          value={change ? (change > 0 ? `+${change}` : change) : null} unit="kg"
          sub={trend?.length > 1 ? `${trend.length} readings` : 'Not enough data'}
          color={change < 0 ? 'text-green-400' : 'text-orange-400'} />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-4">
        <TrendChart data={trend} dataKey="value" type="line" color="#10b981" label="Weight trend (kg)" />
      </div>

      {(!trend || trend.length === 0) && <EmptyHint metric="weight_kg" />}
    </div>
  );
}

function Spinner() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /></div>;
}
function EmptyHint({ metric }) {
  return (
    <div className="bg-[#1e293b] rounded-2xl p-4 border border-dashed border-slate-600 text-center">
      <p className="text-sm text-slate-400">No <code className="text-indigo-400">{metric}</code> data yet.</p>
      <p className="text-xs text-slate-500 mt-1">Sync from Apple Health to see trends.</p>
    </div>
  );
}
