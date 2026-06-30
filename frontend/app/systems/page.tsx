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
import wsManager from '@/lib/websocket'
import { RefreshCw } from 'lucide-react'

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
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <Select
            options={ENV_OPTIONS}
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            placeholder=""
            className="w-48"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder=""
            className="w-48"
          />
          <button
            onClick={load}
            className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100 transition-colors px-3 py-2 rounded-md hover:bg-gray-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <span className="text-xs text-gray-500">{filtered.length} systems</span>
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">Failed to load systems: {error}</div>
          ) : (
            <SystemsTable systems={filtered} />
          )}
        </Card>
      </div>
    </AppShell>
  )
}
