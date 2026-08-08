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
    return await crud.create_exam(db, exam, current_user["id"])

@router.get("/stats/overview")
async def get_exam_stats_overview(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    total_exams = await crud.count_exams(db)
    # Mocking other stats for now, in a real system we'd query other microservices
    # or an aggregated database
    return {
        "total_exams": total_exams,
        "total_questions": 150,  # mock
        "total_users": 1200,     # mock
        "total_results": 450     # mock
    }


@router.get("/{exam_id}", response_model=schemas.ExamResponse)
async def get_exam(exam_id: str, db: AsyncSession = Depends(get_db)):
    exam = await crud.get_exam_by_id(db, exam_id)
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
    return await crud.update_exam(db, exam_id, update_data)
