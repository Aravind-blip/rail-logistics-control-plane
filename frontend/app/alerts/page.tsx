'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getAlerts, acknowledgeAlert, resolveAlert } from '@/lib/api'
import type { Alert } from '@/types'
import AppShell from '@/components/layout/AppShell'
import AlertsTable from '@/components/tables/AlertsTable'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import wsManager from '@/lib/websocket'
import { RefreshCw } from 'lucide-react'

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
]

export default function AlertsPage() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [filtered, setFiltered] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await getAlerts()
      setAlerts(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) { router.replace('/login'); return }
    load()
    wsManager.connect()
    const unsub = wsManager.subscribe('alert', load)
    return () => unsub()
  }, [router, load])

  useEffect(() => {
    let result = alerts
    if (severityFilter) result = result.filter((a) => a.severity === severityFilter)
    if (statusFilter) result = result.filter((a) => a.status === statusFilter)
    setFiltered(result)
  }, [alerts, severityFilter, statusFilter])

  async function handleAcknowledge(id: string) {
    setActionLoading(id + '_ack')
    try {
      const updated = await acknowledgeAlert(id)
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (e: any) {
      alert('Failed to acknowledge: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResolve(id: string) {
    setActionLoading(id + '_res')
    try {
      const updated = await resolveAlert(id)
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    } catch (e: any) {
      alert('Failed to resolve: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AppShell title="Alerts">
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            options={SEVERITY_OPTIONS}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-44"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-44"
          />
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100 transition-colors px-3 py-2 rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <span className="text-xs text-gray-500">{filtered.length} alerts</span>
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">Failed to load alerts: {error}</div>
          ) : (
            <AlertsTable
              alerts={filtered}
              onAcknowledge={handleAcknowledge}
              onResolve={handleResolve}
              actionLoading={actionLoading}
            />
          )}
        </Card>
      </div>
    </AppShell>
  )
}
