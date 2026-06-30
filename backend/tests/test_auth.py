import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_returns_jwt_token(client: AsyncClient):
    """Valid credentials should return a JWT access token."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@railops.local", "password": "admin123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0
    assert data["user"]["email"] == "admin@railops.local"
    assert data["user"]["role"] == "admin"


@pytest.mark.asyncio
async def test_login_operator_returns_jwt_token(client: AsyncClient):
    """Operator login should also return a valid JWT."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "operator@railops.local", "password": "operator123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "operator"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    """Wrong password should return 401."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "admin@railops.local", "password": "wrongpassword"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_unknown_user(client: AsyncClient):
    """Unknown email should return 401."""
    response = await client.post(
        "/api/auth/login",
        json={"email": "ghost@railops.local", "password": "any"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, admin_token: str):
    """Authenticated /me endpoint should return current user details."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "admin@railops.local"


@pytest.mark.asyncio
async def test_get_me_invalid_token(client: AsyncClient):
    """Invalid token should return 401."""
    response = await client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer not-a-real-token"},
    )
    assert response.status_code == 401
