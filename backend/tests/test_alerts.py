import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_viewer_cannot_acknowledge_alert(client: AsyncClient, viewer_token: str):
    """Viewer role must receive 403 when trying to acknowledge an alert."""
    # First get an open alert
    list_resp = await client.get(
        "/api/alerts/?status=open",
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert list_resp.status_code == 200
    alerts = list_resp.json()
    assert len(alerts) > 0

    alert_id = alerts[0]["id"]
    ack_resp = await client.post(
        f"/api/alerts/{alert_id}/acknowledge",
        json={"acknowledged_by": "viewer@railops.local"},
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert ack_resp.status_code == 403


@pytest.mark.asyncio
async def test_operator_can_acknowledge_alert(client: AsyncClient, operator_token: str):
    """Operator role must be able to acknowledge an open alert (200)."""
    list_resp = await client.get(
        "/api/alerts/?status=open",
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert list_resp.status_code == 200
    alerts = list_resp.json()
    assert len(alerts) > 0

    alert_id = alerts[0]["id"]
    ack_resp = await client.post(
        f"/api/alerts/{alert_id}/acknowledge",
        json={"acknowledged_by": "operator@railops.local"},
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    assert ack_resp.status_code == 200
    data = ack_resp.json()
    assert data["status"] == "acknowledged"
    assert data["acknowledged_by"] == "operator@railops.local"


@pytest.mark.asyncio
async def test_viewer_cannot_resolve_alert(client: AsyncClient, viewer_token: str, operator_token: str):
    """Viewer cannot resolve an alert."""
    # Grab any acknowledged alert (or create one first)
    list_resp = await client.get(
        "/api/alerts/?status=acknowledged",
        headers={"Authorization": f"Bearer {operator_token}"},
    )
    if list_resp.status_code == 200 and len(list_resp.json()) > 0:
        alert_id = list_resp.json()[0]["id"]
    else:
        # acknowledge a fresh one first
        open_resp = await client.get(
            "/api/alerts/?status=open",
            headers={"Authorization": f"Bearer {operator_token}"},
        )
        alert_id = open_resp.json()[0]["id"]
        await client.post(
            f"/api/alerts/{alert_id}/acknowledge",
            json={"acknowledged_by": "operator@railops.local"},
            headers={"Authorization": f"Bearer {operator_token}"},
        )

    resolve_resp = await client.post(
        f"/api/alerts/{alert_id}/resolve",
        json={"resolved_by": "viewer@railops.local"},
        headers={"Authorization": f"Bearer {viewer_token}"},
    )
    assert resolve_resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_can_resolve_alert(client: AsyncClient, admin_token: str, operator_token: str):
    """Admin must be able to resolve any alert (200)."""
    # Get or create an acknowledged alert
    list_resp = await client.get(
        "/api/alerts/?status=acknowledged",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert list_resp.status_code == 200
    alerts = list_resp.json()
    assert len(alerts) > 0

    alert_id = alerts[0]["id"]
    resolve_resp = await client.post(
        f"/api/alerts/{alert_id}/resolve",
        json={"resolved_by": "admin@railops.local"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "resolved"


@pytest.mark.asyncio
async def test_list_alerts_requires_auth(client: AsyncClient):
    """Unauthenticated request to list alerts should be rejected (401 or 403)."""
    resp = await client.get("/api/alerts/")
    assert resp.status_code in (401, 403)
