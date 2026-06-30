'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Server,
  Bell,
  GitBranch,
  Activity,
  ClipboardList,
  Train,
  Zap,
} from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/systems', label: 'Systems', icon: Server },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/workflows', label: 'Workflows', icon: GitBranch },
  { href: '/observability', label: 'Observability', icon: Activity },
  { href: '/audit-logs', label: 'Audit Logs', icon: ClipboardList },
  { href: '/freight-risk', label: 'Freight Risk', icon: Train },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-800">
        <div className="bg-blue-600 p-1.5 rounded-md">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">Rail Logistics</p>
          <p className="text-xs text-gray-500 leading-tight">Control Plane</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group',
                active
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800 border border-transparent'
              )}
            >
              <Icon
                className={clsx(
                  'h-4 w-4 flex-shrink-0',
                  active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-800">
        <p className="text-xs text-gray-600">v1.0.0 — Rail Ops Platform</p>
      </div>
    </aside>
  )
}
