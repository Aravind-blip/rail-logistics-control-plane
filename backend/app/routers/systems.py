import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.system import DistributedSystem
from app.models.audit_log import AuditLog
from app.schemas.system import SystemCreate, SystemRead, SystemUpdate
from app.auth.jwt import get_current_user
from app.auth.rbac import require_admin, require_any_role
from app.models.user import User

router = APIRouter(prefix="/api/systems", tags=["systems"])


@router.get("/", response_model=list[SystemRead])
async def list_systems(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    result = await db.execute(select(DistributedSystem).order_by(DistributedSystem.name))
    return list(result.scalars().all())


@router.get("/{system_id}", response_model=SystemRead)
async def get_system(
    system_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    result = await db.execute(select(DistributedSystem).where(DistributedSystem.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found")
    return system


@router.post("/", response_model=SystemRead, status_code=status.HTTP_201_CREATED)
async def create_system(
    data: SystemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    system = DistributedSystem(id=str(uuid.uuid4()), **data.model_dump(), last_heartbeat=datetime.utcnow())
    db.add(system)
    await db.commit()
    await db.refresh(system)
    return system


@router.patch("/{system_id}", response_model=SystemRead)
async def update_system(
    system_id: str,
    data: SystemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    result = await db.execute(select(DistributedSystem).where(DistributedSystem.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found")

    old_status = system.status
    update_data = data.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(system, field, value)

    if "status" in update_data and update_data["status"] != old_status:
        audit = AuditLog(
            id=str(uuid.uuid4()),
            actor=current_user.email,
            action="system_status_changed",
            resource_type="system",
            resource_id=system_id,
            timestamp=datetime.utcnow(),
            metadata_={"old_status": old_status.value, "new_status": update_data["status"].value},
        )
        db.add(audit)

    await db.commit()
    await db.refresh(system)
    return system


@router.delete("/{system_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_system(
    system_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    result = await db.execute(select(DistributedSystem).where(DistributedSystem.id == system_id))
    system = result.scalar_one_or_none()
    if not system:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="System not found")
    await db.delete(system)
    await db.commit()
