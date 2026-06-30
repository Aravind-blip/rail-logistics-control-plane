'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { getFreightRisks, getSystems } from '@/lib/api'
import type { FreightRisk, DistributedSystem } from '@/types'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { format } from 'date-fns'
import PageError from '@/components/ui/PageError'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react'
import { clsx } from 'clsx'

function riskColor(prob: number) {
  if (prob >= 0.7) return 'text-red-400'
  if (prob >= 0.4) return 'text-yellow-400'
  return 'text-green-400'
}

function riskBg(prob: number) {
  if (prob >= 0.7) return 'bg-red-500/10 border-red-500/20'
  if (prob >= 0.4) return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-green-500/10 border-green-500/20'
}

function RiskBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color = value >= 0.7 ? 'bg-red-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden max-w-24">
        <div className={clsx('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={clsx('text-sm font-bold tabular-nums', riskColor(value))}>{pct}%</span>
    </div>
  )
}

export default function FreightRiskPage() {
  const router = useRouter()
  const [risks, setRisks] = useState<FreightRisk[]>([])
  const [systems, setSystems] = useState<DistributedSystem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([getFreightRisks(), getSystems()])
      setRisks(r)
      setSystems(s)
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

  const sysMap = Object.fromEntries(systems.map((s) => [s.id, s]))

  const highRiskCount = risks.filter((r) => r.delay_probability >= 0.7).length
  const medRiskCount = risks.filter((r) => r.delay_probability >= 0.4 && r.delay_probability < 0.7).length

  return (
    <AppShell title="Freight Risk Intel">
      <div className="space-y-6">
        <PageHeader
          title="Freight Risk Intel"
          description="ML-derived delay probability scores and recommended actions for active freight corridors."
          count={risks.length}
          countLabel="corridors assessed"
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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <PageError
            title="Could not load freight risk data"
            message={error}
            onRetry={load}
          />
        ) : risks.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No risk assessments available"
            description="Freight risk data will appear here once corridor assessments have been computed."
          />
        ) : (
          <>
            {/* Summary banners */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                <p className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1">High Risk Corridors</p>
                <p className="text-3xl font-bold text-red-300">{highRiskCount}</p>
                <p className="text-xs text-red-500 mt-1">Delay probability ≥ 70%</p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                <p className="text-xs text-yellow-400 font-semibold uppercase tracking-wider mb-1">Medium Risk Corridors</p>
                <p className="text-3xl font-bold text-yellow-300">{medRiskCount}</p>
                <p className="text-xs text-yellow-500 mt-1">Delay probability 40–70%</p>
              </div>
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                <p className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-1">Low Risk Corridors</p>
                <p className="text-3xl font-bold text-green-300">{risks.length - highRiskCount - medRiskCount}</p>
                <p className="text-xs text-green-500 mt-1">Delay probability &lt; 40%</p>
              </div>
            </div>

            {/* Risk table */}
            <Card padding={false}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
                  Corridor Risk Assessment
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      {['Corridor', 'Related System', 'Delay Probability', 'Confidence', 'Primary Risk Factor', 'Recommended Action', 'Updated'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {risks
                      .sort((a, b) => b.delay_probability - a.delay_probability)
                      .map((risk) => {
                        const sys = sysMap[risk.related_system_id]
                        return (
                          <tr key={risk.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {risk.delay_probability >= 0.7 && (
                                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                                )}
                                <span className="font-medium text-gray-100">{risk.corridor}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-200">{sys?.name ?? risk.related_system_id}</p>
                              {sys && <p className="text-xs text-gray-500">{sys.region}</p>}
                            </td>
                            <td className="px-4 py-3 min-w-36">
                              <RiskBar value={risk.delay_probability} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-300 tabular-nums">
                                {Math.round(risk.confidence_score * 100)}%
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={clsx(
                                'inline-flex px-2 py-1 rounded text-xs border',
                                riskBg(risk.delay_probability),
                                riskColor(risk.delay_probability)
                              )}>
                                {risk.primary_risk_factor}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-300 text-xs max-w-xs">{risk.recommended_action}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                              {format(new Date(risk.updated_at), 'MMM d, HH:mm')}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  )
}
