import uuid
from datetime import datetime
from sqlalchemy import String, Float, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SystemMetric(Base):
    __tablename__ = "system_metrics"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    system_id: Mapped[str] = mapped_column(String(36), ForeignKey("distributed_systems.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    latency_ms: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    request_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    heartbeat_age_seconds: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    alert_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    system: Mapped["DistributedSystem"] = relationship("DistributedSystem", back_populates="metrics")
