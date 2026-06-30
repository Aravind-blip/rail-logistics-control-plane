export interface User {
  id: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
}

export interface DistributedSystem {
  id: string
  name: string
  environment: 'cloud' | 'edge' | 'data_center'
  region: string
  status: 'healthy' | 'degraded' | 'offline'
  last_heartbeat: string
  latency_ms: number
  version: string
  owner_team: string
  service_type: string
}

export interface Alert {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  source_system_id: string
  title: string
  description: string
  status: 'open' | 'acknowledged' | 'resolved'
  created_at: string
  acknowledged_by?: string
  resolved_by?: string
  resolved_at?: string
  source_system?: DistributedSystem
}

export interface Workflow {
  id: string
  workflow_type: string
  requester: string
  approver?: string
  risk_level: 'low' | 'medium' | 'high'
  status: 'requested' | 'approved' | 'rejected' | 'completed'
  created_at: string
  updated_at: string
  audit_trail: any[]
}

export interface AuditLog {
  id: string
  actor: string
  action: string
  resource_type: string
  resource_id: string
  timestamp: string
  metadata: any
}

export interface SystemMetric {
  id: string
  system_id: string
  timestamp: string
  latency_ms: number
  request_count: number
  error_rate: number
  heartbeat_age_seconds: number
  alert_count: number
}

export interface FreightRisk {
  id: string
  corridor: string
  related_system_id: string
  delay_probability: number
  confidence_score: number
  primary_risk_factor: string
  recommended_action: string
  updated_at: string
}

export interface DashboardSummary {
  total_systems: number
  healthy_systems: number
  degraded_systems: number
  offline_systems: number
  active_critical_alerts: number
  avg_latency_ms: number
  open_workflows: number
  incident_count: number
  system_health_by_env: Record<string, number>
  alert_volume_by_severity: Record<string, number>
}

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}
