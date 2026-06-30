'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getAuditLogs } from '@/lib/api'
import type { AuditLog } from '@/types'
import AppShell from '@/components/layout/AppShell'
import AuditLogsTable from '@/components/tables/AuditLogsTable'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { RefreshCw } from 'lucide-react'

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filtered, setFiltered] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await getAuditLogs()
      setLogs(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    load()
  }, [router, load])

  // Build dynamic action options from data
  const actionOptions = [
    { value: '', label: 'All Actions' },
    ...Array.from(new Set(logs.map((l) => l.action))).map((a) => ({ value: a, label: a })),
  ]

  useEffect(() => {
    setFiltered(actionFilter ? logs.filter((l) => l.action === actionFilter) : logs)
  }, [logs, actionFilter])

  return (
    <AppShell title="Audit Logs">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Select
            options={actionOptions}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-56"
          />
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100 transition-colors px-3 py-2 rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <span className="text-xs text-gray-500">{filtered.length} entries</span>
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">Failed to load audit logs: {error}</div>
          ) : (
            <AuditLogsTable logs={filtered} />
          )}
        </Card>
      </div>
    </AppShell>
  )
}
