from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.workflow import Workflow, WorkflowStatus
from app.schemas.workflow import WorkflowCreate, WorkflowRead, WorkflowApprove, WorkflowReject
from app.auth.rbac import require_any_role, require_operator_or_admin, require_admin
from app.models.user import User
from app.services import workflow_service
from fastapi import status as http_status

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("/", response_model=list[WorkflowRead])
async def list_workflows(
    wf_status: WorkflowStatus | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    query = select(Workflow).order_by(Workflow.created_at.desc())
    if wf_status:
        query = query.where(Workflow.status == wf_status)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{workflow_id}", response_model=WorkflowRead)
async def get_workflow(
    workflow_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_any_role()),
):
    return await workflow_service.get_workflow(db, workflow_id)


@router.post("/", response_model=WorkflowRead, status_code=http_status.HTTP_201_CREATED)
async def create_workflow(
    data: WorkflowCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_operator_or_admin()),
):
    return await workflow_service.create_workflow(db, data, current_user.email)


@router.post("/{workflow_id}/approve", response_model=WorkflowRead)
async def approve_workflow(
    workflow_id: str,
    body: WorkflowApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    return await workflow_service.approve_workflow(db, workflow_id, body.approver or current_user.email)


@router.post("/{workflow_id}/reject", response_model=WorkflowRead)
async def reject_workflow(
    workflow_id: str,
    body: WorkflowReject,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    return await workflow_service.reject_workflow(db, workflow_id, body.approver or current_user.email, body.reason)
