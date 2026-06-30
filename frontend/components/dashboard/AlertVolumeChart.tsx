'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface AlertVolumeChartProps {
  data: Record<string, number>
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
      <p className="text-gray-300 font-medium mb-1 capitalize">{label}</p>
      <p style={{ color: SEVERITY_COLORS[label] ?? '#9ca3af' }}>
        Alerts: <span className="font-bold">{payload[0]?.value}</span>
      </p>
    </div>
  )
}

export default function AlertVolumeChart({ data }: AlertVolumeChartProps) {
  const chartData = ['critical', 'high', 'medium', 'low'].map((sev) => ({
    severity: sev,
    count: data[sev] ?? 0,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="severity" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] ?? '#6b7280'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
