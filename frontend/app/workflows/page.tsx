'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isOperator, isAdmin } from '@/lib/auth'
import { getWorkflows, createWorkflow, approveWorkflow, rejectWorkflow } from '@/lib/api'
import type { Workflow } from '@/types'
import AppShell from '@/components/layout/AppShell'
import WorkflowsTable from '@/components/tables/WorkflowsTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import { Plus } from 'lucide-react'

const WORKFLOW_TYPE_OPTIONS = [
  { value: 'deployment', label: 'Deployment' },
  { value: 'maintenance', label: 'Maintenance Window' },
  { value: 'rollback', label: 'Rollback' },
  { value: 'scaling', label: 'Auto-Scaling Adjustment' },
  { value: 'config_change', label: 'Configuration Change' },
  { value: 'incident_response', label: 'Incident Response' },
]

const RISK_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function WorkflowsPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newType, setNewType] = useState('deployment')
  const [newRisk, setNewRisk] = useState('low')

  const load = useCallback(async () => {
    try {
      const data = await getWorkflows()
      setWorkflows(data)
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

  async function handleApprove(id: string) {
    setActionLoading(id + '_approve')
    try {
      const updated = await approveWorkflow(id)
      setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
    } catch (e: any) {
      alert('Failed to approve: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id + '_reject')
    try {
      const updated = await rejectWorkflow(id)
      setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
    } catch (e: any) {
      alert('Failed to reject: ' + e.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreate() {
    setCreating(true)
    setCreateError(null)
    try {
      const wf = await createWorkflow({ workflow_type: newType, risk_level: newRisk })
      setWorkflows((prev) => [wf, ...prev])
      setShowModal(false)
      setNewType('deployment')
      setNewRisk('low')
    } catch (e: any) {
      setCreateError(e.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <AppShell title="Workflows">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">{workflows.length} workflows</span>
          {isOperator() && (
            <Button onClick={() => setShowModal(true)} size="sm">
              <Plus className="h-3.5 w-3.5" />
              New Workflow
            </Button>
          )}
        </div>

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner />
            </div>
          ) : error ? (
            <div className="p-6 text-red-400 text-sm">Failed to load workflows: {error}</div>
          ) : (
            <WorkflowsTable
              workflows={workflows}
              onApprove={handleApprove}
              onReject={handleReject}
              actionLoading={actionLoading}
            />
          )}
        </Card>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Workflow">
        <div className="space-y-4">
          {createError && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-lg px-4 py-3">
              {createError}
            </div>
          )}
          <Select
            label="Workflow Type"
            options={WORKFLOW_TYPE_OPTIONS}
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          />
          <Select
            label="Risk Level"
            options={RISK_LEVEL_OPTIONS}
            value={newRisk}
            onChange={(e) => setNewRisk(e.target.value)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button loading={creating} onClick={handleCreate}>
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  )
}
