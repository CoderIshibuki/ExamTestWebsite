import pytest
import httpx
import uuid

pytestmark = pytest.mark.anyio

async def test_auth_flow(client: httpx.AsyncClient):
    # Test register
    username = f"user_{uuid.uuid4().hex[:8]}"
    register_data = {
        "username": username,
        "email": f"{username}@test.com",
        "password": "password123"
    }
    resp = await client.post("/api/v1/auth/register", json=register_data)
    assert resp.status_code == 201

    # Test login
    resp = await client.post(
        "/api/v1/auth/login",
        data={"username": username, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()

async def test_exam_flow(client: httpx.AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create exam
    exam_data = {
        "title": "E2E Test Exam",
        "description": "Integration test",
        "duration": 60,
        "total_score": 100,
        "passing_score": 50,
        "type": "quiz",
        "status": "draft"
    }
    resp = await client.post("/api/v1/exams/", json=exam_data, headers=headers)
    assert resp.status_code == 201
    exam = resp.json()
    exam_id = exam["id"]
    assert exam["title"] == "E2E Test Exam"

    # List exams
    resp = await client.get("/api/v1/exams/", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) > 0
    
async def test_question_flow(client: httpx.AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create question
    q_data = {
        "content": "What is 2+2?",
        "type": "multiple_choice",
        "difficulty": "easy",
        "points": 1,
        "options": ["3", "4", "5", "6"],
        "correct_answers": ["4"],
        "explanation": "Math"
    }
    resp = await client.post("/api/v1/questions/", json=q_data, headers=headers)
    assert resp.status_code == 201
    assert resp.json()["content"] == "What is 2+2?"
