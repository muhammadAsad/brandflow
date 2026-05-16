'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const DATA = [
  { month: 'Jan', reach: 1.2 }, { month: 'Feb', reach: 1.5 },
  { month: 'Mar', reach: 1.3 }, { month: 'Apr', reach: 1.9 },
  { month: 'May', reach: 2.1 }, { month: 'Jun', reach: 2.4 },
];

export function ReachTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={70}>
      <AreaChart data={DATA} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7c3aed" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="reach" stroke="#7c3aed" strokeWidth={2.5} fill="url(#reachGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
