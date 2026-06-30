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
import PageError from '@/components/ui/PageError'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import wsManager from '@/lib/websocket'
import { Bell, RefreshCw } from 'lucide-react'

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
  const toast = useToast()
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
    wsManager.connect()
    const unsub = wsManager.subscribe('alert_update', load)
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
      toast.success('Alert acknowledged', 'Alert status updated to acknowledged.')
    } catch (e: any) {
      toast.error('Acknowledge failed', e.message ?? 'Unable to acknowledge alert. Try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResolve(id: string) {
    setActionLoading(id + '_res')
    try {
      const updated = await resolveAlert(id)
      setAlerts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
      toast.success('Alert resolved', 'Alert has been marked as resolved.')
    } catch (e: any) {
      toast.error('Resolve failed', e.message ?? 'Unable to resolve alert. Try again.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <AppShell title="Alerts & Incidents">
      <div className="space-y-4">
        <PageHeader
          title="Alerts & Incidents"
          description="Monitor and action operational alerts across all distributed systems."
          count={filtered.length}
          countLabel="alerts"
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

        <div className="flex items-center gap-3 flex-wrap">
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
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <PageError
              title="Could not load alerts"
              message={error}
              onRetry={load}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={severityFilter || statusFilter ? 'No alerts match the current filters' : 'No alerts found'}
              description={
                severityFilter || statusFilter
                  ? 'Try adjusting the severity or status filter.'
                  : 'All systems are operating normally. No alerts have been raised.'
              }
            />
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
