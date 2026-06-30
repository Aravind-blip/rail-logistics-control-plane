'use client'

import { formatDistanceToNow } from 'date-fns'
import type { DistributedSystem } from '@/types'
import Badge from '@/components/ui/Badge'

interface SystemsTableProps {
  systems: DistributedSystem[]
}

export default function SystemsTable({ systems }: SystemsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {['Name', 'Environment', 'Region', 'Status', 'Latency', 'Version', 'Owner Team', 'Last Heartbeat'].map(
              (h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {systems.map((sys) => (
            <tr key={sys.id} className="hover:bg-gray-750 transition-colors group">
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-gray-100">{sys.name}</p>
                  <p className="text-xs text-gray-500">{sys.service_type}</p>
                </div>
              </td>
              <td className="px-4 py-3">
                <Badge variant={sys.environment}>{sys.environment.replace('_', ' ')}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-300">{sys.region}</td>
              <td className="px-4 py-3">
                <Badge variant={sys.status}>{sys.status}</Badge>
              </td>
              <td className="px-4 py-3">
                <span
                  className={
                    sys.latency_ms > 500
                      ? 'text-red-400 font-medium'
                      : sys.latency_ms > 200
                      ? 'text-yellow-400 font-medium'
                      : 'text-green-400 font-medium'
                  }
                >
                  {sys.latency_ms.toFixed(0)} ms
                </span>
              </td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{sys.version}</td>
              <td className="px-4 py-3 text-gray-300">{sys.owner_team}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">
                {formatDistanceToNow(new Date(sys.last_heartbeat), { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {systems.length === 0 && (
        <div className="text-center py-12 text-gray-500">No systems found.</div>
      )}
    </div>
  )
}
