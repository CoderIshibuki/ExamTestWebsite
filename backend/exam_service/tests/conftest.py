import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from main import app
from database import engine, Base
from dependencies import get_current_user, require_teacher_or_admin, require_admin

from sqlalchemy.pool import NullPool
from sqlalchemy.ext.asyncio import create_async_engine
from config import settings

test_engine = create_async_engine(settings.DATABASE_URL, poolclass=NullPool)

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

def mock_user():
    return {"id": "123e4567-e89b-12d3-a456-426614174000", "role": "admin", "token": "mocktoken"}

from sqlalchemy.ext.asyncio import async_sessionmaker, AsyncSession
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

from database import get_db
app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_user] = mock_user
app.dependency_overrides[require_teacher_or_admin] = mock_user
app.dependency_overrides[require_admin] = mock_user
