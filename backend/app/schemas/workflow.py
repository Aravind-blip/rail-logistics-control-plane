from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any
from app.models.workflow import RiskLevel, WorkflowStatus


class WorkflowBase(BaseModel):
    workflow_type: str
    requester: str
    risk_level: RiskLevel = RiskLevel.low
    description: str | None = None


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowApprove(BaseModel):
    approver: str


class WorkflowReject(BaseModel):
    approver: str
    reason: str | None = None


class WorkflowRead(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    approver: str | None
    status: WorkflowStatus
    created_at: datetime
    updated_at: datetime
    audit_trail: list[Any]
