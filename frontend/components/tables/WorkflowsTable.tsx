'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Workflow } from '@/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { isAdmin } from '@/lib/auth'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface WorkflowsTableProps {
  workflows: Workflow[]
  onApprove: (id: string) => void
  onReject: (id: string) => void
  actionLoading: string | null
}

export default function WorkflowsTable({ workflows, onApprove, onReject, actionLoading }: WorkflowsTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const admin = isAdmin()

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            {['', 'Type', 'Requester', 'Risk Level', 'Status', 'Created', 'Actions'].map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {workflows.map((wf) => (
            <>
              <tr key={wf.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 w-8">
                  <button
                    onClick={() => setExpanded(expanded === wf.id ? null : wf.id)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    {expanded === wf.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 font-medium text-gray-200">{wf.workflow_type}</td>
                <td className="px-4 py-3 text-gray-300">{wf.requester}</td>
                <td className="px-4 py-3">
                  <Badge variant={wf.risk_level}>{wf.risk_level}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={wf.status}>{wf.status}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                  {format(new Date(wf.created_at), 'MMM d, HH:mm')}
                </td>
                <td className="px-4 py-3">
                  {wf.status === 'requested' && admin && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        loading={actionLoading === wf.id + '_approve'}
                        onClick={() => onApprove(wf.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actionLoading === wf.id + '_reject'}
                        onClick={() => onReject(wf.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {wf.approver && (
                    <span className="text-xs text-gray-500">by {wf.approver}</span>
                  )}
                </td>
              </tr>
              {expanded === wf.id && (
                <tr key={wf.id + '_expanded'} className="bg-gray-900/50">
                  <td colSpan={7} className="px-6 py-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Audit Trail</p>
                    {wf.audit_trail?.length > 0 ? (
                      <div className="space-y-1.5">
                        {wf.audit_trail.map((entry: any, i: number) => (
                          <div key={i} className="text-xs text-gray-400 flex gap-3">
                            <span className="text-gray-600 tabular-nums">
                              {entry.timestamp ? format(new Date(entry.timestamp), 'MMM d HH:mm:ss') : '—'}
                            </span>
                            <span className="text-gray-300">{entry.action || JSON.stringify(entry)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">No audit trail entries.</p>
                    )}
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
      {workflows.length === 0 && (
        <div className="text-center py-12 text-gray-500">No workflows found.</div>
      )}
    </div>
  )
}
