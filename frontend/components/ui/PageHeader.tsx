import { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  count?: number
  countLabel?: string
  actions?: ReactNode
}

export default function PageHeader({ title, description, count, countLabel, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
        {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {count !== undefined && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2.5 py-1 rounded-full border border-gray-700">
            {count} {countLabel ?? 'records'}
          </span>
        )}
        {actions}
      </div>
    </div>
  )
}
