'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { AuditLog } from '@/types'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface AuditLogsTableProps {
  logs: AuditLog[]
}

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {['', 'Actor', 'Action', 'Resource Type', 'Resource ID', 'Timestamp'].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {logs.map((log) => (
            <>
              <tr key={log.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 w-8">
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <button
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                      className="text-gray-500 hover:text-gray-300"
                    >
                      {expanded === log.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-200 font-medium">{log.actor}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-gray-700 text-blue-300 px-2 py-1 rounded">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{log.resource_type}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.resource_id}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                </td>
              </tr>
              {expanded === log.id && (
                <tr key={log.id + '_exp'} className="bg-gray-900/50">
                  <td colSpan={6} className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Metadata</p>
                    <pre className="text-xs text-gray-300 bg-gray-950 rounded p-3 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="text-center py-12 text-gray-500">No audit logs found.</div>
      )}
    </div>
  )
}
