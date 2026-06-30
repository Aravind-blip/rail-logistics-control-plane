'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import type { SystemMetric } from '@/types'

interface LatencyChartProps {
  metrics: SystemMetric[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      <p className="text-blue-400 font-bold">{payload[0]?.value?.toFixed(1)} ms</p>
    </div>
  )
}

export default function LatencyChart({ metrics }: LatencyChartProps) {
  // Aggregate by timestamp — show avg latency over time
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  // Take up to last 20 data points
  const points = sorted.slice(-20).map((m) => ({
    time: format(new Date(m.timestamp), 'HH:mm'),
    latency: m.latency_ms,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={points} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="time" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} unit="ms" />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="latency"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
