'use client'

import { format } from 'date-fns'
import type { Alert } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { canMutate } from '@/lib/auth'

interface AlertsTableProps {
  alerts: Alert[]
  onAcknowledge: (id: string) => void
  onResolve: (id: string) => void
  actionLoading: string | null
}

export default function AlertsTable({ alerts, onAcknowledge, onResolve, actionLoading }: AlertsTableProps) {
  const canAct = canMutate()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {['Severity', 'Title', 'Source System', 'Status', 'Created', 'Actions'].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-4 py-3">
                <Badge variant={alert.severity}>{alert.severity}</Badge>
              </td>
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-100">{alert.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{alert.description}</p>
                </div>
              </td>
              <td className="px-4 py-3 text-gray-300">
                {alert.source_system?.name ?? alert.source_system_id}
              </td>
              <td className="px-4 py-3">
                <Badge variant={alert.status}>{alert.status}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                {format(new Date(alert.created_at), 'MMM d, HH:mm')}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {alert.status === 'open' && canAct && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={actionLoading === alert.id + '_ack'}
                      onClick={() => onAcknowledge(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {alert.status !== 'resolved' && canAct && (
                    <Button
                      size="sm"
                      variant="success"
                      loading={actionLoading === alert.id + '_res'}
                      onClick={() => onResolve(alert.id)}
                    >
                      Resolve
                    </Button>
                  )}
                  {alert.status === 'resolved' && (
                    <span className="text-xs text-gray-600">
                      {alert.resolved_by && `by ${alert.resolved_by}`}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {alerts.length === 0 && (
        <div className="text-center py-12 text-gray-500">No alerts found.</div>
      )}
    </div>
  )
}
