from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.alert import AlertSeverity, AlertStatus


class AlertBase(BaseModel):
    severity: AlertSeverity
    source_system_id: str
    title: str
    description: str


class AlertCreate(AlertBase):
    pass


class AlertAcknowledge(BaseModel):
    acknowledged_by: str


class AlertResolve(BaseModel):
    resolved_by: str


class AlertRead(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: AlertStatus
    created_at: datetime
    acknowledged_by: str | None
    acknowledged_at: datetime | None
    resolved_by: str | None
    resolved_at: datetime | None
