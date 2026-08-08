from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import crud, schemas
from database import get_db
from dependencies import get_current_user, require_teacher_or_admin
import os
from services.cache import CacheService

redis_url = os.getenv("REDIS_URL", "redis://redis_cache:6379")
cache = CacheService(redis_url)

router = APIRouter(prefix="/api/v1/exams", tags=["Exams"])

@router.get("/", response_model=List[schemas.ExamResponse])
async def list_exams(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    async def fetch_data():
        return await crud.get_exams(db, skip=skip, limit=limit)
    
    key = f"exams:list:{skip}:{limit}"
    exams = await cache.get_or_set(key, fetch_data, ttl=300)
    return exams

@router.post("/", response_model=schemas.ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam: schemas.ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    new_exam = await crud.create_exam(db, exam, current_user["id"])
    await cache.invalidate_pattern("exams:list:*")
    return new_exam

@router.get("/stats/overview")
async def get_exam_stats_overview(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    total_exams = await crud.count_exams(db)
    return {
        "total_exams": total_exams,
        "total_questions": 0,
        "total_users": 0,
        "total_results": 0
    }


@router.get("/{exam_id}", response_model=schemas.ExamResponse)
async def get_exam(exam_id: str, db: AsyncSession = Depends(get_db)):
    async def fetch_data():
        return await crud.get_exam_by_id(db, exam_id)
    
    key = f"exam:{exam_id}"
    exam = await cache.get_or_set(key, fetch_data, ttl=300)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

@router.put("/{exam_id}", response_model=schemas.ExamResponse)
async def update_exam(
    exam_id: str,
    exam_update: schemas.ExamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if current_user["role"] != "admin" and str(exam.created_by) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    updated = await crud.update_exam(db, exam_id, exam_update)
    await cache.invalidate_pattern("exams:list:*")
    await cache.invalidate(f"exam:{exam_id}")
    return updated

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user["role"] != "admin" and str(exam.created_by) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    await crud.delete_exam(db, exam_id)
    await cache.invalidate_pattern("exams:list:*")
    await cache.invalidate(f"exam:{exam_id}")

@router.post("/{exam_id}/publish", response_model=schemas.ExamResponse)
async def publish_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user["role"] != "admin" and str(exam.created_by) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    if exam.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft exams can be published")
        
    update_data = schemas.ExamUpdate(status="published")
    updated = await crud.update_exam(db, exam_id, update_data)
    await cache.invalidate_pattern("exams:list:*")
    await cache.invalidate(f"exam:{exam_id}")
    return updated

@router.post("/{exam_id}/start", response_model=schemas.ExamAttemptResponse)
async def start_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.status != "published":
        raise HTTPException(status_code=400, detail="Exam is not published yet")

    active_attempt = await crud.get_active_exam_attempt(db, exam_id, current_user["id"])
    if active_attempt:
        return active_attempt
        
    attempt_count = await crud.get_exam_attempt_count(db, exam_id, current_user["id"])
    if exam.max_attempts and attempt_count >= exam.max_attempts:
        raise HTTPException(status_code=403, detail="Maximum attempts reached")

    attempt = await crud.create_exam_attempt(db, exam_id, current_user["id"], exam.duration_minutes)
    return attempt

@router.post("/attempts/{attempt_id}/answers", response_model=schemas.ExamAttemptAnswerResponse)
async def save_answer(
    attempt_id: str,
    answer: schemas.ExamAttemptAnswerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    attempt = await crud.get_exam_attempt(db, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt is already submitted or expired")
        
    import datetime
    if datetime.datetime.now(datetime.timezone.utc) > attempt.expires_at:
        await crud.submit_exam_attempt(db, attempt_id)
        raise HTTPException(status_code=400, detail="Exam time expired")
        
    saved_answer = await crud.upsert_exam_attempt_answer(db, attempt_id, answer.question_id, answer.selected_answer)
    return saved_answer

@router.post("/attempts/{attempt_id}/submit", response_model=schemas.ExamAttemptResponse)
async def submit_exam(
    attempt_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    attempt = await crud.get_exam_attempt(db, attempt_id)
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
        
    if attempt.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if attempt.status != "in_progress":
        raise HTTPException(status_code=400, detail="Attempt is already submitted or expired")
        
    import datetime
    if datetime.datetime.now(datetime.timezone.utc) > attempt.expires_at:
        submitted_attempt, updated = await crud.submit_exam_attempt(db, attempt_id)
    else:
        submitted_attempt, updated = await crud.submit_exam_attempt(db, attempt_id)
    
    # Check if this was a fresh submit transition
    if not updated:
        # Already submitted before by another concurrent request
        return submitted_attempt
    
    # Fetch all answers for this attempt
    from sqlalchemy.future import select
    import models as m
    result = await db.execute(select(m.ExamAttemptAnswer).where(m.ExamAttemptAnswer.attempt_id == attempt.id))
    answers = result.scalars().all()
    
    answers_dict = {str(a.question_id): a.selected_answer for a in answers}
    
    # Call grading service
    import httpx
    from config import settings
    try:
        async with httpx.AsyncClient() as client:
            payload = {
                "attempt_id": attempt_id,
                "exam_id": str(attempt.exam_id),
                "user_id": str(attempt.user_id),
                "answers": answers_dict
            }
            # Create a system token for internal communication
            import jwt
            token = jwt.encode({"sub": "system", "role": "system"}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
            headers = {"Authorization": f"Bearer {token}"}
            await client.post(f"{settings.GRADING_SERVICE_URL}/api/v1/grading/submit", json=payload, headers=headers)
    except Exception as e:
        print(f"Error calling grading service: {e}")
        
    return submitted_attempt
