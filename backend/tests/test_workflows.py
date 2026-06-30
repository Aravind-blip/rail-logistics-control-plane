import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_operator_cannot_approve_workflow(client: AsyncClient, operator_token: str):
    """Operator role must receive 403 when attempting to approve a workflow."""
    # Create a workflow as operator first
    create_resp = await client.post(
        "/api/workflows/",
        json={
            "workflow_type": "software_deployment",
            "requester": "operator@railops.local",
            "risk_level": "low",
            "description": "Test deploy for approval RBAC check",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert create_resp.status_code == 201
    workflow_id = create_resp.json()["id"]

    approve_resp = await client.post(
        f"/api/workflows/{workflow_id}/approve",
        json={"approver": "operator@railops.local"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert approve_resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_approve_workflow(client: AsyncClient, admin_token: str, operator_token: str):
    """Admin role must be able to approve a requested workflow (200)."""
    # Create workflow as operator
    create_resp = await client.post(
        "/api/workflows/",
        json={
            "workflow_type": "capacity_scaling",
            "requester": "operator@railops.local",
            "risk_level": "medium",
            "description": "Scale batch processor for admin approval test",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert create_resp.status_code == 201
    workflow_id = create_resp.json()["id"]

    approve_resp = await client.post(
        f"/api/workflows/{workflow_id}/approve",
        json={"approver": "admin@railops.local"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert approve_resp.status_code == 200
    data = approve_resp.json()
    assert data["status"] == "approved"
    assert data["approver"] == "admin@railops.local"


@pytest.mark.asyncio
async def test_admin_can_reject_workflow(client: AsyncClient, admin_token: str, operator_token: str):
    """Admin must be able to reject a requested workflow (200)."""
    create_resp = await client.post(
        "/api/workflows/",
        json={
            "workflow_type": "config_change",
            "requester": "operator@railops.local",
            "risk_level": "high",
            "description": "High-risk config change pending admin rejection test",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert create_resp.status_code == 201
    workflow_id = create_resp.json()["id"]

    reject_resp = await client.post(
        f"/api/workflows/{workflow_id}/reject",
        json={"approver": "admin@railops.local", "reason": "Insufficient impact analysis provided"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert reject_resp.status_code == 200
    data = reject_resp.json()
    assert data["status"] == "rejected"
    assert any(e.get("event") == "rejected" for e in data["audit_trail"])


@pytest.mark.asyncio
async def test_viewer_cannot_create_workflow(client: AsyncClient, viewer_token: str):
    """Viewer role must receive 403 when attempting to create a workflow."""
    resp = await client.post(
        "/api/workflows/",
        json={
            "workflow_type": "maintenance",
            "requester": "viewer@railops.local",
            "risk_level": "low",
        },
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_workflows_viewer(client: AsyncClient, viewer_token: str):
    """Viewer must be able to list workflows (read-only)."""
    resp = await client.get(
        "/api/workflows/",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
