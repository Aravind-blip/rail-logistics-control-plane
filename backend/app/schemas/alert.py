from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from app.models.alert import AlertSeverity, AlertStatus


class AlertBase(BaseModel):
    severity: AlertSeverity
    source_system_id: str
    title: str
    description: str

    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("title must not be blank")
        if len(v) > 200:
            raise ValueError("title must be 200 characters or fewer")
        return v

    @field_validator("description")
    @classmethod
    def description_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("description must not be blank")
        if len(v) > 2000:
            raise ValueError("description must be 2000 characters or fewer")
        return v

    @field_validator("source_system_id")
    @classmethod
    def source_system_id_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("source_system_id is required")
        return v.strip()


class AlertCreate(AlertBase):
    pass


class AlertAcknowledge(BaseModel):
    acknowledged_by: str | None = None


class AlertResolve(BaseModel):
    resolved_by: str | None = None


class AlertRead(AlertBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    status: AlertStatus
    created_at: datetime
    acknowledged_by: str | None = None
    acknowledged_at: datetime | None = None
    resolved_by: str | None = None
    resolved_at: datetime | None = None
