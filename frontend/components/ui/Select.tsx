'use client'

import { clsx } from 'clsx'
import { ChevronDown } from 'lucide-react'
import { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export default function Select({ label, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
      <div className="relative">
        <select
          className={clsx(
            'w-full appearance-none bg-gray-700 border border-gray-600 text-gray-100 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
    </div>
  )
}
