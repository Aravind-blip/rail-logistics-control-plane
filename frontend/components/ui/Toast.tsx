'use client'

import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { clsx } from 'clsx'

type ToastType = 'success' | 'error' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000)
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    success: (title, message) => add('success', title, message),
    error: (title, message) => add('error', title, message),
    warning: (title, message) => add('warning', title, message),
  }

  const icons: Record<ToastType, ReactNode> = {
    success: <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />,
    error: <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0" />,
  }

  const styles: Record<ToastType, string> = {
    success: 'border-green-700/50 bg-gray-900',
    error: 'border-red-700/50 bg-gray-900',
    warning: 'border-yellow-700/50 bg-gray-900',
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={clsx(
              'flex items-start gap-3 px-4 py-3 rounded-lg border shadow-xl text-sm animate-in slide-in-from-right-4',
              styles[t.type]
            )}
          >
            {icons[t.type]}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-100">{t.title}</p>
              {t.message && <p className="text-gray-400 text-xs mt-0.5">{t.message}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="text-gray-600 hover:text-gray-300 flex-shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
