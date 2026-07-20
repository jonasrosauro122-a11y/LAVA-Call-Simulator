import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendPoint } from '../types';

interface TrendChartProps {
  data: TrendPoint[];
  metrics: { key: string; color: string }[];
  height?: number;
  yDomain?: [number, number];
}

export function TrendChart({ data, metrics, height = 300, yDomain = [0, 100] }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-ink-200 dark:stroke-ink-800" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor' }} className="text-ink-400" />
        <YAxis domain={yDomain} tick={{ fontSize: 11, fill: 'currentColor' }} className="text-ink-400" />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {metrics.map((m) => (
          <Line key={m.key} type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
