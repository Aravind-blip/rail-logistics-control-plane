import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.main import app
from app.database import Base, get_db
from app.seed import seed_database

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(scope="session", loop_scope="session", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestSessionLocal() as db:
        await seed_database(db)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(loop_scope="session")
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture(loop_scope="session")
async def admin_token(client: AsyncClient) -> str:
    resp = await client.post("/api/auth/login", json={"email": "admin@railops.local", "password": "admin123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest_asyncio.fixture(loop_scope="session")
async def operator_token(client: AsyncClient) -> str:
    resp = await client.post("/api/auth/login", json={"email": "operator@railops.local", "password": "operator123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest_asyncio.fixture(loop_scope="session")
async def viewer_token(client: AsyncClient) -> str:
    resp = await client.post("/api/auth/login", json={"email": "viewer@railops.local", "password": "viewer123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]
