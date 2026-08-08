from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import crud, schemas
from database import get_db
from dependencies import require_admin

router = APIRouter(prefix="/api/v1/exams/{exam_id}", tags=["Exam Assignments"])

@router.post("/assign", response_model=schemas.ExamAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def assign_teacher(
    exam_id: str,
    assignment: schemas.ExamAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    return await crud.add_exam_assignment(db, exam_id, assignment)
