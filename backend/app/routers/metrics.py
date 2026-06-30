from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.metric import MetricCreate, MetricRead
from app.auth.rbac import require_any_role, require_operator_or_admin
from app.models.user import User
from app.services import metrics_service
from fastapi import status as http_status

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


@router.get("/", response_model=list[MetricRead])
async def get_latest_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    return await metrics_service.get_all_systems_latest_metrics(db)


@router.get("/system/{system_id}", response_model=list[MetricRead])
async def get_system_metrics(
    system_id: str,
    limit: int = Query(100, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    return await metrics_service.get_metrics_for_system(db, system_id, limit)


@router.post("/", response_model=MetricRead, status_code=http_status.HTTP_201_CREATED)
async def record_metric(
    data: MetricCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin()),
):
    return await metrics_service.record_metric(db, data)
