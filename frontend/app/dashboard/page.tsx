'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getDashboardSummary, getMetrics } from '@/lib/api'
import type { DashboardSummary, SystemMetric } from '@/types'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/dashboard/StatCard'
import SystemHealthChart from '@/components/dashboard/SystemHealthChart'
import AlertVolumeChart from '@/components/dashboard/AlertVolumeChart'
import LatencyChart from '@/components/dashboard/LatencyChart'
import EventStream from '@/components/dashboard/EventStream'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import wsManager from '@/lib/websocket'
import {
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Bell,
  Gauge,
  GitBranch,
  Flame,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [sum, met] = await Promise.all([getDashboardSummary(), getMetrics()])
      setSummary(sum)
      setMetrics(met)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login')
      return
    }
    loadData()
    wsManager.connect()
    const unsub = wsManager.subscribe('system_update', () => {
      loadData()
    })
    return () => unsub()
  }, [router, loadData])

  return (
    <AppShell title="Operations Dashboard">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-700/50 text-red-400 rounded-lg p-6 text-sm">
          Failed to load dashboard: {error}
        </div>
      ) : summary ? (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Systems"
              value={summary.total_systems}
              subtitle="Cloud · Edge · Data Center"
              icon={Server}
              colorClass="bg-blue-500/10 text-blue-400"
            />
            <StatCard
              title="Healthy Systems"
              value={summary.healthy_systems}
              subtitle={`${summary.degraded_systems} degraded · ${summary.offline_systems} offline`}
              icon={CheckCircle}
              colorClass="bg-green-500/10 text-green-400"
            />
            <StatCard
              title="P0 / P1 Alerts"
              value={summary.active_critical_alerts}
              subtitle="Critical alerts requiring immediate escalation"
              icon={Bell}
              colorClass="bg-red-500/10 text-red-400"
            />
            <StatCard
              title="Fleet Avg Latency"
              value={`${summary.avg_latency_ms?.toFixed(0) ?? 0} ms`}
              subtitle="p95 proxy across all registered systems"
              icon={Gauge}
              colorClass="bg-yellow-500/10 text-yellow-400"
            />
            <StatCard
              title="Pending Approvals"
              value={summary.open_workflows}
              subtitle="Ops workflows awaiting admin sign-off"
              icon={GitBranch}
              colorClass="bg-purple-500/10 text-purple-400"
            />
            <StatCard
              title="Resolved Incidents"
              value={summary.incident_count}
              subtitle="Closed in last 7 days"
              icon={Flame}
              colorClass="bg-orange-500/10 text-orange-400"
            />
            <StatCard
              title="Degraded Systems"
              value={summary.degraded_systems}
              subtitle="SLO breach risk — elevated latency or errors"
              icon={AlertTriangle}
              colorClass="bg-yellow-500/10 text-yellow-400"
            />
            <StatCard
              title="Offline Systems"
              value={summary.offline_systems}
              subtitle="No heartbeat — telemetry gap active"
              icon={XCircle}
              colorClass="bg-red-500/10 text-red-400"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health by Environment</CardTitle>
              </CardHeader>
              <SystemHealthChart data={summary.system_health_by_env} />
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Alert Volume by Severity</CardTitle>
              </CardHeader>
              <AlertVolumeChart data={summary.alert_volume_by_severity} />
            </Card>
          </div>

          {/* Latency + Event Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Latency Over Time</CardTitle>
              </CardHeader>
              {metrics.length > 0 ? (
                <LatencyChart metrics={metrics} />
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-600 text-sm">
                  No metric data available
                </div>
              )}
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Live Event Stream</CardTitle>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live
                </span>
              </CardHeader>
              <EventStream />
            </Card>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}
