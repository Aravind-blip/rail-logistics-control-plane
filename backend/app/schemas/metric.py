from pydantic import BaseModel, ConfigDict
from datetime import datetime


class MetricBase(BaseModel):
    system_id: str
    latency_ms: float = 0.0
    request_count: int = 0
    error_rate: float = 0.0
    heartbeat_age_seconds: float = 0.0
    alert_count: int = 0


class MetricCreate(MetricBase):
    pass


class MetricRead(MetricBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    timestamp: datetime
