'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getMetrics, getSystems } from '@/lib/api'
import type { SystemMetric, DistributedSystem } from '@/types'
import AppShell from '@/components/layout/AppShell'
import LatencyChart from '@/components/dashboard/LatencyChart'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { format } from 'date-fns'
import { RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

export default function ObservabilityPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [systems, setSystems] = useState<DistributedSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [met, sys] = await Promise.all([getMetrics(), getSystems()])
      setMetrics(met)
      setSystems(sys)
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

  const systemMap = Object.fromEntries(systems.map((s) => [s.id, s]))

  // Latest metric per system
  const latestBySystem = metrics.reduce((acc, m) => {
    if (!acc[m.system_id] || new Date(m.timestamp) > new Date(acc[m.system_id].timestamp)) {
      acc[m.system_id] = m
    }
    return acc
  }, {} as Record<string, SystemMetric>)

  const rows = Object.values(latestBySystem)

  return (
    <AppShell title="Observability">
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-700/50 text-red-400 rounded-lg p-6 text-sm">
            Failed to load metrics: {error}
          </div>
        ) : (
          <>
            {/* Latency Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Latency Over Time (All Systems)</CardTitle>
                <button
                  onClick={load}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-100 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </button>
              </CardHeader>
              {metrics.length > 0 ? (
                <LatencyChart metrics={metrics} />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                  No metric data available
                </div>
              )}
            </Card>

            {/* Metrics Table */}
            <Card padding={false}>
              <div className="px-6 py-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
                  Per-System Metrics
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {['System', 'Latency', 'Req Count', 'Error Rate', 'Heartbeat Age', 'Alert Count', 'Timestamp'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {rows.map((m) => {
                      const sys = systemMap[m.system_id]
                      return (
                        <tr key={m.id} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-100">{sys?.name ?? m.system_id}</p>
                            <p className="text-xs text-gray-500">{sys?.region}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                'font-medium',
                                m.latency_ms > 500 ? 'text-red-400' : m.latency_ms > 200 ? 'text-yellow-400' : 'text-green-400'
                              )}
                            >
                              {m.latency_ms.toFixed(1)} ms
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300 tabular-nums">{m.request_count.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span
                              className={clsx(
                                'font-medium',
                                m.error_rate > 0.1 ? 'text-red-400' : m.error_rate > 0.05 ? 'text-yellow-400' : 'text-green-400'
                              )}
                            >
                              {(m.error_rate * 100).toFixed(2)}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-300 tabular-nums">{m.heartbeat_age_seconds.toFixed(0)}s</td>
                          <td className="px-4 py-3">
                            <span className={clsx('font-medium', m.alert_count > 0 ? 'text-red-400' : 'text-gray-400')}>
                              {m.alert_count}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {format(new Date(m.timestamp), 'HH:mm:ss')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {rows.length === 0 && (
                  <div className="text-center py-12 text-gray-500">No metrics available.</div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
