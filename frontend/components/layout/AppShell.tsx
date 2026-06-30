'use client'

import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppShellProps {
  children: React.ReactNode
  title?: string
}

export default function AppShell({ children, title }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-60 min-h-screen">
        <TopBar title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
