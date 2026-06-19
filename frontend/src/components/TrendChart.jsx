import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#2D383E',
  border: '1px solid #3A4C55',
  borderRadius: 8,
  color: '#D4C9C7',
  fontSize: 12,
};

export default function TrendChart({ data, dataKey, type = 'line', color = '#AA7452', label }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm" style={{ color: '#6B7680' }}>
        No data yet
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs mb-2 font-medium" style={{ color: '#969A9E' }}>{label}</p>}
      <ResponsiveContainer width="100%" height={120}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2C35" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#6B7680', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#6B7680', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1C2C35" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#6B7680', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#6B7680', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
