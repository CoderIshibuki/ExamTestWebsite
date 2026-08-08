import httpx
from typing import List, Dict
from config import settings

class ExamClient:
    def __init__(self):
        self.base_url = settings.EXAM_SERVICE_URL

    async def get_exam_questions(self, exam_id: str, token: str) -> List[dict]:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.base_url}/api/v1/exams/{exam_id}/questions",
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
            return response.json()

    async def get_exam_schedule(self, exam_id: str, token: str) -> dict:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.base_url}/api/v1/exams/{exam_id}/schedule",
                headers={"Authorization": f"Bearer {token}"}
            )
            response.raise_for_status()
            return response.json()

    async def submit_exam_result(self, exam_id: str, user_id: str, result: dict, token: str):
        async with httpx.AsyncClient(timeout=10.0) as client:
            # We will send this to grading service in the future, for now mock or send to exam service
            response = await client.post(
                f"{self.base_url}/api/v1/exams/{exam_id}/submit",
                json={"user_id": user_id, "result": result},
                headers={"Authorization": f"Bearer {token}"}
            )
            return response.json() if response.status_code == 200 else {}

exam_client = ExamClient()
