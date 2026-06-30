import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
}

export default function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-gray-800 border border-gray-700 rounded-lg',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex items-center justify-between', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={clsx('text-sm font-semibold text-gray-200 uppercase tracking-wider', className)}>
      {children}
    </h3>
  )
}
