'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

export default function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      document.addEventListener('keydown', handler)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className={clsx(
          'relative w-full bg-gray-800 border border-gray-700 rounded-xl shadow-2xl',
          sizeMap[size]
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-base font-semibold text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-100 transition-colors p-1 rounded-md hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
