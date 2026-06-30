from pydantic import BaseModel, ConfigDict
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


class SystemCreate(SystemBase):
    pass


class SystemUpdate(BaseModel):
    name: str | None = None
    status: SystemStatus | None = None
    latency_ms: float | None = None
    version: str | None = None
    owner_team: str | None = None


class SystemRead(SystemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    last_heartbeat: datetime
