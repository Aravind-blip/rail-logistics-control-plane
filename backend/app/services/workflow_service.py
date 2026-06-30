import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.workflow import Workflow, WorkflowStatus
from app.models.audit_log import AuditLog
from app.schemas.workflow import WorkflowCreate


async def create_workflow(db: AsyncSession, data: WorkflowCreate, actor: str) -> Workflow:
    now = datetime.utcnow()
    workflow = Workflow(
        id=str(uuid.uuid4()),
        **data.model_dump(),
        status=WorkflowStatus.requested,
        created_at=now,
        updated_at=now,
        audit_trail=[
            {"event": "created", "actor": actor, "timestamp": now.isoformat()}
        ],
    )
    db.add(workflow)

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor=actor,
        action="workflow_created",
        resource_type="workflow",
        resource_id=workflow.id,
        timestamp=now,
        metadata_={"workflow_type": data.workflow_type, "risk_level": data.risk_level.value},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(workflow)
    return workflow


async def get_workflow(db: AsyncSession, workflow_id: str) -> Workflow:
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workflow not found")
    return workflow


async def approve_workflow(db: AsyncSession, workflow_id: str, approver: str) -> Workflow:
    workflow = await get_workflow(db, workflow_id)
    if workflow.status != WorkflowStatus.requested:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workflow cannot be approved in its current state")
    now = datetime.utcnow()
    workflow.status = WorkflowStatus.approved
    workflow.approver = approver
    workflow.updated_at = now
    trail = list(workflow.audit_trail or [])
    trail.append({"event": "approved", "actor": approver, "timestamp": now.isoformat()})
    workflow.audit_trail = trail

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor=approver,
        action="workflow_approved",
        resource_type="workflow",
        resource_id=workflow_id,
        timestamp=now,
        metadata_={"workflow_type": workflow.workflow_type},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(workflow)
    return workflow


async def reject_workflow(db: AsyncSession, workflow_id: str, approver: str, reason: str | None = None) -> Workflow:
    workflow = await get_workflow(db, workflow_id)
    if workflow.status != WorkflowStatus.requested:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Workflow cannot be rejected in its current state")
    now = datetime.utcnow()
    workflow.status = WorkflowStatus.rejected
    workflow.approver = approver
    workflow.updated_at = now
    trail = list(workflow.audit_trail or [])
    trail.append({"event": "rejected", "actor": approver, "reason": reason, "timestamp": now.isoformat()})
    workflow.audit_trail = trail

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor=approver,
        action="workflow_rejected",
        resource_type="workflow",
        resource_id=workflow_id,
        timestamp=now,
        metadata_={"workflow_type": workflow.workflow_type, "reason": reason},
    )
    db.add(audit)
    await db.commit()
    await db.refresh(workflow)
    return workflow
