import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_audit_log_created_after_alert_acknowledge(client: AsyncClient, operator_token: str, admin_token: str):
    """Acknowledging an alert must produce an audit log entry with action=alert_acknowledged."""
    # Get an open alert
    list_resp = await client.get(
        "/api/alerts/?status=open",
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert list_resp.status_code == 200
    alerts = list_resp.json()
    assert len(alerts) > 0, "No open alerts available for test"

    alert_id = alerts[0]["id"]

    # Acknowledge it
    ack_resp = await client.post(
        f"/api/alerts/{alert_id}/acknowledge",
        json={"acknowledged_by": "operator@railops.local"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert ack_resp.status_code == 200

    # Check audit log
    audit_resp = await client.get(
        "/api/audit-logs/?action=alert_acknowledged",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    matching = [log for log in logs if log["resource_id"] == alert_id]
    assert len(matching) >= 1
    assert matching[0]["action"] == "alert_acknowledged"
    assert matching[0]["actor"] == "operator@railops.local"


@pytest.mark.asyncio
async def test_audit_log_created_after_workflow_creation(client: AsyncClient, operator_token: str, admin_token: str):
    """Creating a workflow must produce an audit log entry with action=workflow_created."""
    create_resp = await client.post(
        "/api/workflows/",
        json={
            "workflow_type": "emergency_maintenance",
            "requester": "operator@railops.local",
            "risk_level": "high",
            "description": "Audit test workflow creation",
        },
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert create_resp.status_code == 201
    workflow_id = create_resp.json()["id"]

    audit_resp = await client.get(
        "/api/audit-logs/?action=workflow_created",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    matching = [log for log in logs if log["resource_id"] == workflow_id]
    assert len(matching) >= 1
    assert matching[0]["action"] == "workflow_created"


@pytest.mark.asyncio
async def test_audit_log_created_after_login(client: AsyncClient, admin_token: str):
    """Logging in must produce an audit log entry with action=login."""
    audit_resp = await client.get(
        "/api/audit-logs/?action=login",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    assert len(logs) > 0
    assert all(log["action"] == "login" for log in logs)


@pytest.mark.asyncio
async def test_audit_log_created_after_alert_resolve(client: AsyncClient, operator_token: str, admin_token: str):
    """Resolving an alert must create an audit log with action=alert_resolved."""
    # Need an open alert — acknowledge then resolve
    list_resp = await client.get(
        "/api/alerts/?status=open",
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert list_resp.status_code == 200
    alerts = list_resp.json()
    assert len(alerts) > 0

    alert_id = alerts[0]["id"]
    # Acknowledge first
    await client.post(
        f"/api/alerts/{alert_id}/acknowledge",
        json={"acknowledged_by": "operator@railops.local"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    # Now resolve
    resolve_resp = await client.post(
        f"/api/alerts/{alert_id}/resolve",
        json={"resolved_by": "operator@railops.local"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert resolve_resp.status_code == 200

    audit_resp = await client.get(
        "/api/audit-logs/?action=alert_resolved",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert audit_resp.status_code == 200
    logs = audit_resp.json()
    matching = [log for log in logs if log["resource_id"] == alert_id]
    assert len(matching) >= 1
    assert matching[0]["action"] == "alert_resolved"
