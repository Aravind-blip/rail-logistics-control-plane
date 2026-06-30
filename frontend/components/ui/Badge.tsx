'use client'

import { clsx } from 'clsx'

type Variant =
  | 'healthy'
  | 'degraded'
  | 'offline'
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'open'
  | 'acknowledged'
  | 'resolved'
  | 'cloud'
  | 'edge'
  | 'data_center'
  | 'admin'
  | 'operator'
  | 'viewer'
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'default'

const variantClasses: Record<Variant, string> = {
  healthy: 'bg-green-500/20 text-green-400 border border-green-500/30',
  degraded: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  offline: 'bg-red-500/20 text-red-400 border border-red-500/30',
  critical: 'bg-red-600/20 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  open: 'bg-red-500/20 text-red-400 border border-red-500/30',
  acknowledged: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  cloud: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
  edge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  data_center: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
  admin: 'bg-red-500/20 text-red-400 border border-red-500/30',
  operator: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  viewer: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  requested: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  approved: 'bg-green-500/20 text-green-400 border border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
  completed: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  default: 'bg-gray-700 text-gray-300 border border-gray-600',
}

interface BadgeProps {
  variant?: Variant | string
  children: React.ReactNode
  className?: string
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  const cls = variantClasses[variant as Variant] ?? variantClasses.default
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium tracking-wide uppercase',
        cls,
        className
      )}
    >
      {children}
    </span>
  )
}
