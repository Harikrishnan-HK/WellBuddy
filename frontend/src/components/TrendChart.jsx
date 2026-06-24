import React from 'react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E4DED2',
  borderRadius: 8,
  color: '#000000',
  fontSize: 12,
};

export default function TrendChart({ data, dataKey, type = 'line', color = '#F95C4B', label }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm" style={{ color: '#9C988F' }}>
        No data yet
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs mb-2 font-medium" style={{ color: '#6B6862' }}>{label}</p>}
      <ResponsiveContainer width="100%" height={120}>
        {type === 'bar' ? (
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DED2" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#9C988F', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#9C988F', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DED2" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#9C988F', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fill: '#9C988F', fontSize: 10 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
