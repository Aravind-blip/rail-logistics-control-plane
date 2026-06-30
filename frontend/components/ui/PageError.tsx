import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

interface PageErrorProps {
  title?: string
  message: string
  onRetry?: () => void
}

export default function PageError({ title = 'Failed to load data', message, onRetry }: PageErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <AlertTriangle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="text-base font-semibold text-gray-100 mb-1">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      )}
    </div>
  )
}
