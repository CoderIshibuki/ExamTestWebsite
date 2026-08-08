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
                f"{self.base_url}/api/v1/exams/{exam_id}/snapshots",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                snapshots = response.json()
                questions = []
                for sn in snapshots:
                    q_data = {
                        "id": sn.get("question_id"),
                        "question_text": sn.get("question_text"),
                        "choices": sn.get("choices"),
                        "correct_answer": sn.get("correct_answer"),
                        "point_possible": sn.get("points", 1.0)
                    }
                    questions.append(q_data)
                return questions
            
            # Fallback if the endpoint does not exist yet or doesn't return full details:
            # 1. We might fetch question_ids from exam service
            # 2. Fetch full details from question service
            
            # Mock data if we can't reach the real services for now
            return []
