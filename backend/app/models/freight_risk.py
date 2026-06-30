import uuid
from datetime import datetime
from sqlalchemy import String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class FreightRisk(Base):
    __tablename__ = "freight_risks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    corridor: Mapped[str] = mapped_column(String(255), nullable=False)
    related_system_id: Mapped[str] = mapped_column(String(36), ForeignKey("distributed_systems.id"), nullable=False)
    delay_probability: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    primary_risk_factor: Mapped[str] = mapped_column(String(255), nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    related_system: Mapped["DistributedSystem"] = relationship("DistributedSystem", back_populates="freight_risks")
