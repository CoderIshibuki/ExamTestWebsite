import httpx
from config import settings
from typing import List, Dict, Any

class ExamClient:
    def __init__(self):
        self.base_url = settings.EXAM_SERVICE_URL
        self.question_url = settings.QUESTION_SERVICE_URL
        
    async def get_exam_questions(self, exam_id: str, token: str) -> List[Dict[str, Any]]:
        # In a complete microservices architecture, Exam Service would have an endpoint 
        # to fetch all questions for an exam. Since Exam Service only stores question_ids,
        # it would aggregate from Question Service.
        # Assuming Exam Service HAS this endpoint:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/exams/{exam_id}/questions",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                exam_questions = response.json()
                questions = []
                async with httpx.AsyncClient() as q_client:
                    for eq in exam_questions:
                        q_id = eq.get("question_id")
                        if not q_id: continue
                        q_res = await q_client.get(f"{self.question_url}/api/v1/questions/{q_id}")
                        if q_res.status_code == 200:
                            q_data = q_res.json()
                            q_data["point_possible"] = eq.get("point_value", 1.0)
                            q_data["id"] = q_data.get("_id", q_id)
                            questions.append(q_data)
                return questions
            
            # Fallback if the endpoint does not exist yet or doesn't return full details:
            # 1. We might fetch question_ids from exam service
            # 2. Fetch full details from question service
            
            # Mock data if we can't reach the real services for now
            return []
