import React from 'react';

export default function MetricCard({ icon, label, value, unit, sub, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`rounded-2xl p-4 flex items-center gap-3 w-full text-left ${onClick ? 'active:opacity-70' : ''}`}
      style={{ background: '#2D383E' }}
    >
      <div
        className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0 text-[#AA7452]"
        style={{ background: '#051822' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#969A9E' }}>{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold" style={{ color: '#D4C9C7' }}>
            {value != null ? value : '—'}
          </span>
          {unit && <span className="text-xs" style={{ color: '#969A9E' }}>{unit}</span>}
        </div>
        {sub && <p className="text-xs truncate" style={{ color: '#6B7680' }}>{sub}</p>}
      </div>
    </Tag>
  );
}
