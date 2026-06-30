from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import Any


class AuditLogBase(BaseModel):
    actor: str
    action: str
    resource_type: str
    resource_id: str
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    actor: str
    action: str
    resource_type: str
    resource_id: str
    timestamp: datetime
    metadata_: dict[str, Any] = Field(default_factory=dict, alias="metadata")

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        if hasattr(obj, "__dict__"):
            data = {
                "id": obj.id,
                "actor": obj.actor,
                "action": obj.action,
                "resource_type": obj.resource_type,
                "resource_id": obj.resource_id,
                "timestamp": obj.timestamp,
                "metadata": obj.metadata_,
            }
            return super().model_validate(data, *args, **kwargs)
        return super().model_validate(obj, *args, **kwargs)
