from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.freight_risk import FreightRisk
from app.schemas.freight_risk import FreightRiskRead
from app.auth.rbac import require_any_role, require_operator_or_admin
from app.models.user import User
from app.services import freight_risk_service

router = APIRouter(prefix="/api/freight-risk", tags=["freight-risk"])


@router.get("/", response_model=list[FreightRiskRead])
async def list_freight_risks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    result = await db.execute(select(FreightRisk).order_by(FreightRisk.delay_probability.desc()))
    return list(result.scalars().all())


@router.get("/{risk_id}", response_model=FreightRiskRead)
async def get_freight_risk(
    risk_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    result = await db.execute(select(FreightRisk).where(FreightRisk.id == risk_id))
    risk = result.scalar_one_or_none()
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freight risk record not found")
    return risk


@router.post("/refresh", response_model=list[FreightRiskRead])
async def refresh_risks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin()),
):
    """Re-run the rule-based risk engine against all systems."""
    return await freight_risk_service.refresh_freight_risks(db)
