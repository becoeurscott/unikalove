'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function GrowthChart({ data }: { data: { day: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      {/* key remounts the chart when data arrives so the draw animation always plays */}
      <AreaChart
        key={data.map((d) => d.count).join('-')}
        data={data}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6336C" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#D6336C" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #f1f1f1', fontSize: 13 }}
          cursor={{ stroke: '#D6336C', strokeOpacity: 0.2, strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#D6336C"
          strokeWidth={2.5}
          fill="url(#growth)"
          dot={{ r: 4, fill: '#fff', stroke: '#D6336C', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#D6336C', stroke: '#fff', strokeWidth: 2 }}
          isAnimationActive
          animationDuration={1600}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Donut({
  data,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  centerLabel?: string;
  centerValue?: string;
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart key={data.map((d) => d.value).join('-')}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={85}
            paddingAngle={2}
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
            isAnimationActive
            animationBegin={150}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: 12, border: '1px solid #f1f1f1', fontSize: 13 }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centerValue && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-bold">{centerValue}</div>
          {centerLabel && <div className="text-xs text-gray-500">{centerLabel}</div>}
        </div>
      )}
    </div>
  );
}
