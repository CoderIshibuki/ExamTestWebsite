import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient):
    response = await async_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_create_exam(async_client: AsyncClient):
    exam_data = {
        "title": "Math Final Exam",
        "description": "Test your math skills",
        "duration_minutes": 90,
        "passing_score": 50
    }
    response = await async_client.post("/api/v1/exams/", json=exam_data)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Math Final Exam"
    assert "id" in data
    assert data["status"] == "draft"

@pytest.mark.asyncio
async def test_get_exams(async_client: AsyncClient):
    # First create one
    exam_data = {
        "title": "History Exam",
        "duration_minutes": 60
    }
    await async_client.post("/api/v1/exams/", json=exam_data)
    
    response = await async_client.get("/api/v1/exams/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1

@pytest.mark.asyncio
async def test_update_exam_and_publish(async_client: AsyncClient):
    exam_data = {
        "title": "Physics Exam",
        "duration_minutes": 45
    }
    create_response = await async_client.post("/api/v1/exams/", json=exam_data)
    exam_id = create_response.json()["id"]

    update_response = await async_client.put(f"/api/v1/exams/{exam_id}", json={"duration_minutes": 50})
    assert update_response.status_code == 200
    assert update_response.json()["duration_minutes"] == 50

    publish_response = await async_client.post(f"/api/v1/exams/{exam_id}/publish")
    assert publish_response.status_code == 200
    assert publish_response.json()["status"] == "published"
