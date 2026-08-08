import pytest
import httpx
import asyncio

API_URL = "http://api_gateway:80"

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def client():
    async with httpx.AsyncClient(base_url=API_URL) as client:
        yield client

@pytest.fixture(scope="session")
async def admin_token(client):
    # Register admin if not exists (or just login)
    register_data = {
        "username": "admin_e2e",
        "email": "admin_e2e@test.com",
        "password": "password123",
        "role": "admin"
    }
    await client.post("/api/v1/auth/register", json=register_data)
    
    # Login
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": "admin_e2e", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    token = response.json()["access_token"]
    return token
