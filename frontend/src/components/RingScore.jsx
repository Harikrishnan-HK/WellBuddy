import React from 'react';

export default function RingScore({ label, value, max = 100, color = '#F95C4B', size = 80 }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4DED2" strokeWidth={8} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={8}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold leading-none" style={{ color: '#000000' }}>{Math.round(pct)}</span>
          <span className="text-[9px]" style={{ color: '#6B6862' }}>/ 100</span>
        </div>
      </div>
      <span className="text-xs font-medium" style={{ color: '#6B6862' }}>{label}</span>
    </div>
  );
}
