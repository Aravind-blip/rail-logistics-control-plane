import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Enum as SAEnum, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class WorkflowStatus(str, enum.Enum):
    requested = "requested"
    approved = "approved"
    rejected = "rejected"
    completed = "completed"


class Workflow(Base):
    __tablename__ = "workflows"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_type: Mapped[str] = mapped_column(String(100), nullable=False)
    requester: Mapped[str] = mapped_column(String(255), nullable=False)
    approver: Mapped[str | None] = mapped_column(String(255), nullable=True)
    risk_level: Mapped[RiskLevel] = mapped_column(SAEnum(RiskLevel), nullable=False, default=RiskLevel.low)
    status: Mapped[WorkflowStatus] = mapped_column(SAEnum(WorkflowStatus), nullable=False, default=WorkflowStatus.requested)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    audit_trail: Mapped[dict] = mapped_column(JSON, nullable=False, default=list)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
