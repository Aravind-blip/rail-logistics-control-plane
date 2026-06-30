'use client'

import { useEffect, useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { getCurrentUser, logout } from '@/lib/auth'
import type { User as UserType } from '@/types'
import Badge from '@/components/ui/Badge'

interface TopBarProps {
  title?: string
}

export default function TopBar({ title }: TopBarProps) {
  const [user, setUser] = useState<UserType | null>(null)

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        {title && <h1 className="text-sm font-semibold text-gray-100">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="h-7 w-7 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-gray-300" />
              </div>
              <span className="text-gray-200">{user.email}</span>
              <Badge variant={user.role}>{user.role}</Badge>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1.5 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  )
}
