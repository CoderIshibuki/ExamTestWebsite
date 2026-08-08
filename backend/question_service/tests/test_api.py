import pytest
from httpx import AsyncClient, ASGITransport
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
from database import db_instance, connect_to_mongo
import pytest_asyncio
from jose import jwt
from config import settings

# Mock JWT token generation for testing
def create_test_token(user_id="testuser", role="teacher"):
    payload = {"sub": user_id, "role": role}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

from database import db_instance, connect_to_mongo, close_mongo_connection

@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    await connect_to_mongo()
    # clean up test db collections
    if db_instance.db is not None:
        await db_instance.db.questions.delete_many({})
        await db_instance.db.categories.delete_many({})
    yield
    await close_mongo_connection()

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_health_check(async_client):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_create_category(async_client):
    token = create_test_token(role="teacher")
    headers = {"Authorization": f"Bearer {token}"}
    data = {"name": "Test Math", "description": "Math questions"}
    
    response = await async_client.post("/api/v1/categories/", json=data, headers=headers)
    assert response.status_code == 201
    assert response.json()["name"] == "Test Math"
    assert "_id" in response.json()

@pytest.mark.asyncio
async def test_create_question(async_client):
    token = create_test_token(role="teacher")
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "content": {"text": "What is 1+1?"},
        "type": "multiple_choice",
        "options": [
            {"id": "A", "text": "1", "is_correct": False},
            {"id": "B", "text": "2", "is_correct": True}
        ],
        "correct_answer": "B",
        "metadata": {
            "difficulty": "easy",
            "subject": "Math",
            "tags": ["basic"]
        }
    }
    
    response = await async_client.post("/api/v1/questions/", json=data, headers=headers)
    assert response.status_code == 201
    assert response.json()["content"]["text"] == "What is 1+1?"
    assert "_id" in response.json()

@pytest.mark.asyncio
async def test_get_questions(async_client):
    response = await async_client.get("/api/v1/questions/")
    assert response.status_code == 200
    assert "items" in response.json()
    assert "total" in response.json()
    assert isinstance(response.json()["items"], list)
