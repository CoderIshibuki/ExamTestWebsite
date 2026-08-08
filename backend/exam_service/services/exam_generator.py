import random
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
import crud, schemas
from services.question_client import fetch_questions

async def generate_exam_from_bank(
    db: AsyncSession,
    exam_id: str,
    request: schemas.GenerateExamRequest,
    token: str
):
    filters = {
        "subject": request.subject,
        "difficulty": request.difficulty,
        "limit": 1000
    }
    
    response_data = await fetch_questions(filters, token)
    
    # Assuming Question Service returns [total, list_of_questions]
    # We should unpack based on how question_service works.
    # In Task 1.1, question_service get_questions returns (total, questions) but API returns it as JSON array or object?
    # Let's inspect what Question Service actually returns.
    
    questions = response_data if isinstance(response_data, list) else response_data.get("data", [])
    if isinstance(questions, dict) and "items" in questions:
        questions = questions["items"]
    elif len(response_data) == 2 and isinstance(response_data[1], list):
        questions = response_data[1]  # (total, list) tuple format
        
    if request.question_types:
        questions = [q for q in questions if q.get("type") in request.question_types]
        
    if len(questions) < request.num_questions:
        raise HTTPException(status_code=400, detail="Not enough questions in bank")
        
    selected = random.sample(questions, request.num_questions)
    
    created_questions = []
    for idx, q in enumerate(selected):
        qid = q.get("id") or q.get("_id")
        exam_question_data = schemas.ExamQuestionCreate(
            question_id=str(qid),
            question_order=idx,
            point_value=request.point_per_question
        )
        created = await crud.add_exam_question(db, exam_id, exam_question_data)
        created_questions.append(created)
        
    return created_questions
