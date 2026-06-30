from pydantic import BaseModel, ConfigDict, field_validator
from datetime import datetime
from typing import Any
from app.models.workflow import RiskLevel, WorkflowStatus

ALLOWED_WORKFLOW_TYPES = {
    "emergency_maintenance_window",
    "hotfix_deployment",
    "horizontal_scaling_event",
    "tls_certificate_rotation",
    "ml_model_promotion",
    "routing_table_update",
    "config_rollback",
    "incident_review",
    "capacity_planning",
    "telemetry_pipeline_validation",
}


class WorkflowBase(BaseModel):
    workflow_type: str
    requester: str
    risk_level: RiskLevel = RiskLevel.low
    description: str | None = None

    @field_validator("workflow_type")
    @classmethod
    def validate_workflow_type(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("workflow_type must not be blank")
        if v not in ALLOWED_WORKFLOW_TYPES:
            allowed = ", ".join(sorted(ALLOWED_WORKFLOW_TYPES))
            raise ValueError(f"workflow_type '{v}' is not recognised. Allowed values: {allowed}")
        return v

    @field_validator("requester")
    @classmethod
    def requester_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("requester must not be blank")
        return v

    @field_validator("description")
    @classmethod
    def description_length(cls, v: str | None) -> str | None:
        if v is not None and len(v.strip()) > 2000:
            raise ValueError("description must be 2000 characters or fewer")
        return v


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowApprove(BaseModel):
    approver: str | None = None


class WorkflowReject(BaseModel):
    approver: str | None = None
    reason: str | None = None


class WorkflowRead(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    approver: str | None = None
    status: WorkflowStatus
    created_at: datetime
    updated_at: datetime
    audit_trail: list[Any]
