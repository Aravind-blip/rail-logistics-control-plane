'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isOperator } from '@/lib/auth'
import { getWorkflows, createWorkflow, approveWorkflow, rejectWorkflow } from '@/lib/api'
import type { Workflow } from '@/types'
import AppShell from '@/components/layout/AppShell'
import WorkflowsTable from '@/components/tables/WorkflowsTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import PageError from '@/components/ui/PageError'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { GitBranch, Plus } from 'lucide-react'

const WORKFLOW_TYPE_OPTIONS = [
  { value: 'hotfix_deployment', label: 'Hotfix Deployment' },
  { value: 'emergency_maintenance_window', label: 'Emergency Maintenance Window' },
  { value: 'routing_table_update', label: 'Routing Table Update' },
  { value: 'tls_certificate_rotation', label: 'TLS Certificate Rotation' },
  { value: 'ml_model_promotion', label: 'ML Model Promotion' },
  { value: 'horizontal_scaling_event', label: 'Horizontal Scaling Event' },
  { value: 'config_rollback', label: 'Config Rollback' },
  { value: 'incident_review', label: 'Incident Review' },
  { value: 'capacity_planning', label: 'Capacity Planning' },
  { value: 'telemetry_pipeline_validation', label: 'Telemetry Pipeline Validation' },
]

const RISK_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export default function WorkflowsPage() {
  const router = useRouter()
  const toast = useToast()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [newType, setNewType] = useState('hotfix_deployment')
  const [newRisk, setNewRisk] = useState('low')
  const [newDescription, setNewDescription] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await getWorkflows()
      setWorkflows(data)
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
  }, [router, load])

  async function handleApprove(id: string) {
    setActionLoading(id + '_approve')
    try {
      const updated = await approveWorkflow(id)
      setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
      toast.success('Workflow approved', 'The workflow request has been approved.')
    } catch (e: any) {
      toast.error('Approval failed', e.message ?? 'Unable to approve workflow. Try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(id: string) {
    setActionLoading(id + '_reject')
    try {
      const updated = await rejectWorkflow(id)
      setWorkflows((prev) => prev.map((w) => (w.id === updated.id ? updated : w)))
      toast.warning('Workflow rejected', 'The workflow request has been rejected.')
    } catch (e: any) {
      toast.error('Rejection failed', e.message ?? 'Unable to reject workflow. Try again.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreate() {
    setCreating(true)
    setCreateError(null)
    try {
      const wf = await createWorkflow({
        workflow_type: newType,
        risk_level: newRisk,
        description: newDescription.trim() || undefined,
      })
      setWorkflows((prev) => [wf, ...prev])
      setShowModal(false)
      setNewType('hotfix_deployment')
      setNewRisk('low')
      setNewDescription('')
      toast.success('Workflow created', 'Your workflow request has been submitted for approval.')
    } catch (e: any) {
      setCreateError(e.message ?? 'Failed to create workflow. Check your inputs and try again.')
    } finally {
      setCreating(false)
    }
  }

  function handleCloseModal() {
    setShowModal(false)
    setCreateError(null)
    setNewDescription('')
  }

  return (
    <AppShell title="Ops Workflows">
      <div className="space-y-4">
        <PageHeader
          title="Ops Workflows"
          description="Submit, track, and approve operational workflow requests across the platform."
          count={workflows.length}
          countLabel="workflows"
          actions={
            isOperator() ? (
              <Button onClick={() => setShowModal(true)} size="sm">
                <Plus className="h-3.5 w-3.5" />
                New Workflow
              </Button>
            ) : undefined
          }
        />

        <Card padding={false}>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <PageError
              title="Could not load workflows"
              message={error}
              onRetry={load}
            />
          ) : workflows.length === 0 ? (
            <EmptyState
              icon={GitBranch}
              title="No workflows found"
              description="No operational workflow requests have been submitted yet."
            />
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

      <Modal open={showModal} onClose={handleCloseModal} title="Submit Workflow Request">
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
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Description <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Describe the reason for this workflow request…"
              maxLength={2000}
              className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2.5 text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-600 mt-1 text-right">{newDescription.length}/2000</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" onClick={handleCloseModal}>
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
