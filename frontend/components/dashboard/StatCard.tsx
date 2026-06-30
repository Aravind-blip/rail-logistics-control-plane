import { clsx } from 'clsx'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: { value: number; label: string }
  colorClass?: string
}

export default function StatCard({ title, value, subtitle, icon: Icon, trend, colorClass }: StatCardProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={clsx('p-2 rounded-md', colorClass ?? 'bg-blue-500/10')}>
            <Icon className={clsx('h-4 w-4', colorClass ? 'text-current' : 'text-blue-400')} />
          </div>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-100 tabular-nums">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {trend && (
        <div
          className={clsx(
            'text-xs font-medium flex items-center gap-1',
            trend.value >= 0 ? 'text-green-400' : 'text-red-400'
          )}
        >
          <span>{trend.value >= 0 ? '↑' : '↓'}</span>
          <span>{Math.abs(trend.value)}% {trend.label}</span>
        </div>
      )}
    </div>
  )
}
