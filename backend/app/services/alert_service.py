import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.alert import Alert, AlertStatus
from app.models.audit_log import AuditLog
from app.models.system import DistributedSystem
from app.schemas.alert import AlertCreate


async def create_alert(db: AsyncSession, data: AlertCreate) -> Alert:
    # Validate source system exists
    sys_result = await db.execute(
        select(DistributedSystem).where(DistributedSystem.id == data.source_system_id)
    )
    if not sys_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"source_system_id '{data.source_system_id}' does not reference a known system",
        )
    alert = Alert(
        id=str(uuid.uuid4()),
        **data.model_dump(),
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return alert


async def get_alert(db: AsyncSession, alert_id: str) -> Alert:
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    return alert


async def acknowledge_alert(db: AsyncSession, alert_id: str, actor: str) -> Alert:
    alert = await get_alert(db, alert_id)
    if alert.status != AlertStatus.open:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Alert is not in open state")
    alert.status = AlertStatus.acknowledged
    alert.acknowledged_by = actor
    alert.acknowledged_at = datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor=actor,
        action="alert_acknowledged",
        resource_type="alert",
        resource_id=alert_id,
        timestamp=datetime.utcnow(),
        metadata_={"alert_title": alert.title, "severity": alert.severity.value},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(alert)
    return alert


async def resolve_alert(db: AsyncSession, alert_id: str, actor: str) -> Alert:
    alert = await get_alert(db, alert_id)
    if alert.status == AlertStatus.resolved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Alert is already resolved")
    alert.status = AlertStatus.resolved
    alert.resolved_by = actor
    alert.resolved_at = datetime.utcnow()

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor=actor,
        action="alert_resolved",
        resource_type="alert",
        resource_id=alert_id,
        timestamp=datetime.utcnow(),
        metadata_={"alert_title": alert.title, "severity": alert.severity.value},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(alert)
    return alert
