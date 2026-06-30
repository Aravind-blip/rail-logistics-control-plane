from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models.system import DistributedSystem, SystemStatus, EnvironmentType
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.models.workflow import Workflow, WorkflowStatus
from app.auth.rbac import require_any_role
from app.models.user import User
from pydantic import BaseModel

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    total_systems: int
    healthy_systems: int
    degraded_systems: int
    offline_systems: int
    active_critical_alerts: int
    avg_latency_ms: float
    open_workflows: int
    incident_count: int
    system_health_by_env: dict[str, dict[str, int]]
    alert_volume_by_severity: dict[str, int]


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    # System counts
    sys_result = await db.execute(select(DistributedSystem))
    systems = sys_result.scalars().all()

    total = len(systems)
    healthy = sum(1 for s in systems if s.status == SystemStatus.healthy)
    degraded = sum(1 for s in systems if s.status == SystemStatus.degraded)
    offline = sum(1 for s in systems if s.status == SystemStatus.offline)
    avg_latency = round(sum(s.latency_ms for s in systems) / total, 2) if total else 0.0

    # Alerts
    alert_result = await db.execute(select(Alert))
    alerts = alert_result.scalars().all()

    critical_open = sum(
        1 for a in alerts if a.severity == AlertSeverity.critical and a.status == AlertStatus.open
    )

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    incident_count = sum(
        1 for a in alerts if a.status == AlertStatus.resolved and a.resolved_at and a.resolved_at >= seven_days_ago
    )

    alert_by_severity: dict[str, int] = {s.value: 0 for s in AlertSeverity}
    for a in alerts:
        if a.status != AlertStatus.resolved:
            alert_by_severity[a.severity.value] += 1

    # Workflows
    wf_result = await db.execute(select(Workflow))
    workflows = wf_result.scalars().all()
    open_wf = sum(1 for w in workflows if w.status == WorkflowStatus.requested)

    # System health by environment
    health_by_env: dict[str, dict[str, int]] = {}
    for env in EnvironmentType:
        env_systems = [s for s in systems if s.environment == env]
        health_by_env[env.value] = {
            "total": len(env_systems),
            "healthy": sum(1 for s in env_systems if s.status == SystemStatus.healthy),
            "degraded": sum(1 for s in env_systems if s.status == SystemStatus.degraded),
            "offline": sum(1 for s in env_systems if s.status == SystemStatus.offline),
        }

    return DashboardSummary(
        total_systems=total,
        healthy_systems=healthy,
        degraded_systems=degraded,
        offline_systems=offline,
        active_critical_alerts=critical_open,
        avg_latency_ms=avg_latency,
        open_workflows=open_wf,
        incident_count=incident_count,
        system_health_by_env=health_by_env,
        alert_volume_by_severity=alert_by_severity,
    )
