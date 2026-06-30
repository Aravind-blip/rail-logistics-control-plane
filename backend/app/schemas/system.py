from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from app.models.system import EnvironmentType, SystemStatus


class SystemBase(BaseModel):
    name: str
    environment: EnvironmentType
    region: str
    status: SystemStatus = SystemStatus.healthy
    latency_ms: float = 0.0
    version: str = "1.0.0"
    owner_team: str
    service_type: str

    @field_validator("name", "region", "owner_team", "service_type")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("field must not be blank")
        return v

    @field_validator("latency_ms")
    @classmethod
    def latency_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("latency_ms must be non-negative")
        return v


class SystemCreate(SystemBase):
    pass


class SystemUpdate(BaseModel):
    name: str | None = None
    status: SystemStatus | None = None
    latency_ms: float | None = None
    version: str | None = None
    owner_team: str | None = None

    @field_validator("name", "owner_team", mode="before")
    @classmethod
    def not_blank_if_present(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("field must not be blank")
        return v

    @field_validator("latency_ms")
    @classmethod
    def latency_non_negative(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("latency_ms must be non-negative")
        return v


class SystemRead(SystemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    last_heartbeat: datetime
