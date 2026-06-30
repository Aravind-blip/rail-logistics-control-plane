import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class EnvironmentType(str, enum.Enum):
    cloud = "cloud"
    edge = "edge"
    data_center = "data_center"


class SystemStatus(str, enum.Enum):
    healthy = "healthy"
    degraded = "degraded"
    offline = "offline"


class DistributedSystem(Base):
    __tablename__ = "distributed_systems"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    environment: Mapped[EnvironmentType] = mapped_column(SAEnum(EnvironmentType), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[SystemStatus] = mapped_column(SAEnum(SystemStatus), nullable=False, default=SystemStatus.healthy)
    last_heartbeat: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    version: Mapped[str] = mapped_column(String(50), nullable=False, default="1.0.0")
    owner_team: Mapped[str] = mapped_column(String(100), nullable=False)
    service_type: Mapped[str] = mapped_column(String(100), nullable=False)

    alerts: Mapped[list] = relationship("Alert", back_populates="source_system", lazy="select")
    metrics: Mapped[list] = relationship("SystemMetric", back_populates="system", lazy="select")
    freight_risks: Mapped[list] = relationship("FreightRisk", back_populates="related_system", lazy="select")
