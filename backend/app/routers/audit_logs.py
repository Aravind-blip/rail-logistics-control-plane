from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogRead
from app.auth.rbac import require_admin, require_any_role
from app.models.user import User

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


@router.get("/", response_model=list[AuditLogRead])
async def list_audit_logs(
    actor: str | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    query = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if actor:
        query = query.where(AuditLog.actor == actor)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    result = await db.execute(query)
    logs = result.scalars().all()
    return [AuditLogRead.model_validate(log) for log in logs]


@router.get("/{log_id}", response_model=AuditLogRead)
async def get_audit_log(
    log_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
    return AuditLogRead.model_validate(log)
