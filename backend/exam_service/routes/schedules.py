from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import crud, schemas
from database import get_db
from dependencies import require_teacher_or_admin

router = APIRouter(prefix="/api/v1/exams/{exam_id}", tags=["Exam Schedules"])

@router.post("/schedule", response_model=schemas.ExamScheduleResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule(
    exam_id: str,
    schedule: schemas.ExamScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_teacher_or_admin)
):
    if schedule.start_time >= schedule.end_time:
        raise HTTPException(status_code=400, detail="start_time must be before end_time")
        
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if current_user["role"] != "admin" and str(exam.created_by) != current_user["id"]:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    return await crud.add_exam_schedule(db, exam_id, schedule)
