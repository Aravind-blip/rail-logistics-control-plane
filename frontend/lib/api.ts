import { getToken, logout } from '@/lib/auth'
import type {
  DashboardSummary,
  DistributedSystem,
  Alert,
  Workflow,
  AuditLog,
  SystemMetric,
  FreightRisk,
} from '@/types'

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api'

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    logout()
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail || `API error ${res.status}`)
  }

  return res.json() as Promise<T>
}

// Dashboard
export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/dashboard/summary')
}

// Systems
export function getSystems(params?: Record<string, string>): Promise<DistributedSystem[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<DistributedSystem[]>(`/systems${qs}`)
}

export function getSystem(id: string): Promise<DistributedSystem> {
  return apiFetch<DistributedSystem>(`/systems/${id}`)
}

// Alerts
export function getAlerts(params?: Record<string, string>): Promise<Alert[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<Alert[]>(`/alerts${qs}`)
}

export function acknowledgeAlert(id: string): Promise<Alert> {
  return apiFetch<Alert>(`/alerts/${id}/acknowledge`, { method: 'POST' })
}

export function resolveAlert(id: string): Promise<Alert> {
  return apiFetch<Alert>(`/alerts/${id}/resolve`, { method: 'POST' })
}

// Workflows
export function getWorkflows(params?: Record<string, string>): Promise<Workflow[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<Workflow[]>(`/workflows${qs}`)
}

export function createWorkflow(data: { workflow_type: string; risk_level: string }): Promise<Workflow> {
  return apiFetch<Workflow>('/workflows', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function approveWorkflow(id: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/workflows/${id}/approve`, { method: 'POST' })
}

export function rejectWorkflow(id: string): Promise<Workflow> {
  return apiFetch<Workflow>(`/workflows/${id}/reject`, { method: 'POST' })
}

// Audit Logs
export function getAuditLogs(params?: Record<string, string>): Promise<AuditLog[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<AuditLog[]>(`/audit-logs${qs}`)
}

// Metrics
export function getMetrics(params?: Record<string, string>): Promise<SystemMetric[]> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<SystemMetric[]>(`/metrics${qs}`)
}

// Freight Risks
export function getFreightRisks(): Promise<FreightRisk[]> {
  return apiFetch<FreightRisk[]>('/freight-risk')
}
