'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getSystems } from '@/lib/api'
import type { DistributedSystem } from '@/types'
import AppShell from '@/components/layout/AppShell'
import SystemsTable from '@/components/tables/SystemsTable'
import Card from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import PageError from '@/components/ui/PageError'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import wsManager from '@/lib/websocket'
import { RefreshCw, Server } from 'lucide-react'

const ENV_OPTIONS = [
  { value: '', label: 'All Environments' },
  { value: 'cloud', label: 'Cloud' },
  { value: 'edge', label: 'Edge' },
  { value: 'data_center', label: 'Data Center' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'degraded', label: 'Degraded' },
  { value: 'offline', label: 'Offline' },
]

export default function SystemsPage() {
  const router = useRouter()
  const [systems, setSystems] = useState<DistributedSystem[]>([])
  const [filtered, setFiltered] = useState<DistributedSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [envFilter, setEnvFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await getSystems()
      setSystems(data)
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
    const unsub = wsManager.subscribe('system_update', load)
    return () => unsub()
  }, [router, load])

  useEffect(() => {
    let result = systems
    if (envFilter) result = result.filter((s) => s.environment === envFilter)
    if (statusFilter) result = result.filter((s) => s.status === statusFilter)
    setFiltered(result)
  }, [systems, envFilter, statusFilter])

  return (
    <AppShell title="Distributed Systems">
      <div className="space-y-4">
        <PageHeader
          title="Distributed Systems"
          description="Live inventory of all registered microservices, edge gateways, and data center workers."
          count={filtered.length}
          countLabel="systems"
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
            options={ENV_OPTIONS}
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="w-48"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-48"
          />
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <PageError
              title="Could not load systems"
              message={error}
              onRetry={load}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Server}
              title={envFilter || statusFilter ? 'No systems match the current filters' : 'No systems registered'}
              description={
                envFilter || statusFilter
                  ? 'Try adjusting the environment or status filter.'
                  : 'No distributed systems have been registered in this environment.'
              }
            />
          ) : (
            <SystemsTable systems={filtered} />
          )}
        </Card>
      </div>
    </AppShell>
  )
}
