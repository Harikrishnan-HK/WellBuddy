import React from 'react';

export default function MetricCard({ icon, label, value, unit, sub, color = 'text-indigo-400' }) {
  return (
    <div className="bg-[#1e293b] rounded-2xl p-4 flex items-center gap-3">
      <div className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-slate-100">
            {value != null ? value : '—'}
          </span>
          {unit && <span className="text-xs text-slate-400">{unit}</span>}
        </div>
        {sub && <p className="text-xs text-slate-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}
