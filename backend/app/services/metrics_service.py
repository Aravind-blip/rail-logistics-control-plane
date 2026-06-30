import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.metric import SystemMetric
from app.models.system import DistributedSystem
from app.schemas.metric import MetricCreate


async def record_metric(db: AsyncSession, data: MetricCreate) -> SystemMetric:
    metric = SystemMetric(id=str(uuid.uuid4()), **data.model_dump())
    db.add(metric)
    await db.commit()
    await db.refresh(metric)
    return metric


async def get_metrics_for_system(db: AsyncSession, system_id: str, limit: int = 100) -> list[SystemMetric]:
    result = await db.execute(
        select(SystemMetric)
        .where(SystemMetric.system_id == system_id)
        .order_by(SystemMetric.timestamp.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_all_systems_latest_metrics(db: AsyncSession) -> list[SystemMetric]:
    """Return the most recent metric for every system."""
    result = await db.execute(select(DistributedSystem))
    systems = result.scalars().all()
    metrics = []
    for system in systems:
        res = await db.execute(
            select(SystemMetric)
            .where(SystemMetric.system_id == system.id)
            .order_by(SystemMetric.timestamp.desc())
            .limit(1)
        )
        m = res.scalar_one_or_none()
        if m:
            metrics.append(m)
    return metrics
