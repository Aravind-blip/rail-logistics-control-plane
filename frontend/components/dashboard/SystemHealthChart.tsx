'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface SystemHealthChartProps {
  data: Record<string, number>
}

const ENV_COLORS: Record<string, string> = {
  cloud: '#3b82f6',
  edge: '#a855f7',
  data_center: '#6366f1',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
      <p className="text-gray-300 font-medium mb-1 capitalize">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function SystemHealthChart({ data }: SystemHealthChartProps) {
  // data is system_health_by_env: Record<env, count_healthy>
  const chartData = Object.entries(data).map(([env, count]) => ({
    env: env.replace('_', ' '),
    Systems: count,
    fill: ENV_COLORS[env] ?? '#6b7280',
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="env" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Systems" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
