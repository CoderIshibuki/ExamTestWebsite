import pytest

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_register_user(async_client):
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "password123",
        "full_name": "Test User"
    }
    response = await async_client.post("/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert "id" in data

@pytest.mark.asyncio
async def test_login_user(async_client):
    # Register first
    user_data = {
        "username": "testlogin",
        "email": "testlogin@example.com",
        "password": "password123"
    }
    await async_client.post("/register", json=user_data)
    
    # Then login
    login_data = {
        "username": "testlogin",
        "password": "password123"
    }
    response = await async_client.post("/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
