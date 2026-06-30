from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.schemas.alert import AlertCreate, AlertRead, AlertAcknowledge, AlertResolve
from app.auth.rbac import require_any_role, require_operator_or_admin
from app.models.user import User
from app.services import alert_service
from fastapi import status as http_status

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/", response_model=list[AlertRead])
async def list_alerts(
    alert_status: AlertStatus | None = Query(None, alias="status"),
    severity: AlertSeverity | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    query = select(Alert).order_by(Alert.created_at.desc())
    if alert_status:
        query = query.where(Alert.status == alert_status)
    if severity:
        query = query.where(Alert.severity == severity)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{alert_id}", response_model=AlertRead)
async def get_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    return await alert_service.get_alert(db, alert_id)


@router.post("/", response_model=AlertRead, status_code=http_status.HTTP_201_CREATED)
async def create_alert(
    data: AlertCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin()),
):
    return await alert_service.create_alert(db, data)


@router.post("/{alert_id}/acknowledge", response_model=AlertRead)
async def acknowledge_alert(
    alert_id: str,
    body: AlertAcknowledge,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin()),
):
    return await alert_service.acknowledge_alert(db, alert_id, body.acknowledged_by or current_user.email)


@router.post("/{alert_id}/resolve", response_model=AlertRead)
async def resolve_alert(
    alert_id: str,
    body: AlertResolve,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin()),
):
    return await alert_service.resolve_alert(db, alert_id, body.resolved_by or current_user.email)
