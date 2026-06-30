import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import enum


class AlertSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class AlertStatus(str, enum.Enum):
    open = "open"
    acknowledged = "acknowledged"
    resolved = "resolved"


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    severity: Mapped[AlertSeverity] = mapped_column(SAEnum(AlertSeverity), nullable=False)
    source_system_id: Mapped[str] = mapped_column(String(36), ForeignKey("distributed_systems.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[AlertStatus] = mapped_column(SAEnum(AlertStatus), nullable=False, default=AlertStatus.open)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    acknowledged_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    source_system: Mapped["DistributedSystem"] = relationship("DistributedSystem", back_populates="alerts")
