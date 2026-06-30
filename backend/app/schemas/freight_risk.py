from pydantic import BaseModel, ConfigDict
from datetime import datetime


class FreightRiskBase(BaseModel):
    corridor: str
    related_system_id: str
    delay_probability: float
    confidence_score: float
    primary_risk_factor: str
    recommended_action: str


class FreightRiskCreate(FreightRiskBase):
    pass


class FreightRiskRead(FreightRiskBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    updated_at: datetime
