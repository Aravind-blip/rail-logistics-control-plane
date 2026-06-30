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
import PageError from '@/components/ui/PageError'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { RefreshCw, ClipboardList } from 'lucide-react'

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
      setError(null)
    } catch (e: any) {
      setError(e.message ?? 'Unable to reach the API. Check that the backend is running.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    load()
  }, [router, load])

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
        <PageHeader
          title="Audit Logs"
          description="Immutable record of all user and system actions across the control plane."
          count={filtered.length}
          countLabel="entries"
          actions={
            <button
              onClick={load}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100 transition-colors px-3 py-2 rounded-md hover:bg-gray-700 border border-transparent hover:border-gray-600"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          }
        />

        <div className="flex items-center gap-3">
          <Select
            options={actionOptions}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-56"
          />
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <PageError
              title="Could not load audit logs"
              message={error}
              onRetry={load}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={actionFilter ? 'No entries match the selected action' : 'No audit log entries'}
              description={
                actionFilter
                  ? 'Try selecting a different action filter.'
                  : 'Audit log entries will appear here as users interact with the platform.'
              }
            />
          ) : (
            <AuditLogsTable logs={filtered} />
          )}
        </Card>
      </div>
    </AppShell>
  )
}
