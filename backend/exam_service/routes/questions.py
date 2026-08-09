from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import crud, schemas
from database import get_db
from dependencies import get_current_user, require_permission
from services.exam_generator import generate_exam_from_bank

router = APIRouter(prefix="/api/v1/exams/{exam_id}", tags=["Exam Questions"])

@router.get("/questions", response_model=list[schemas.ExamQuestionResponse])
async def get_exam_questions(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    return await crud.get_exam_questions(db, exam_id)

@router.post("/questions", response_model=schemas.ExamQuestionResponse, status_code=status.HTTP_201_CREATED)
async def add_question_to_exam(
    exam_id: str,
    question: schemas.ExamQuestionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:update"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    is_owner = str(exam.owner_id) == current_user["id"]
    is_collaborator = any(str(c.user_id) == current_user["id"] for c in getattr(exam, 'collaborators', []))
    if current_user["role"] != "admin" and not is_owner and not is_collaborator:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    if exam.status != "draft":
        raise HTTPException(status_code=409, detail="Cannot modify published exam")
        
    return await crud.add_exam_question(db, exam_id, question)

@router.delete("/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_question_from_exam(
    exam_id: str,
    question_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:update"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    is_owner = str(exam.owner_id) == current_user["id"]
    is_collaborator = any(str(c.user_id) == current_user["id"] for c in getattr(exam, 'collaborators', []))
    if current_user["role"] != "admin" and not is_owner and not is_collaborator:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    if exam.status != "draft":
        raise HTTPException(status_code=409, detail="Cannot modify published exam")
        
    success = await crud.delete_exam_question(db, question_id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found in exam")

@router.post("/generate", response_model=list[schemas.ExamQuestionResponse], status_code=status.HTTP_201_CREATED)
async def generate_exam(
    exam_id: str,
    request: schemas.GenerateExamRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:update"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    is_owner = str(exam.owner_id) == current_user["id"]
    is_collaborator = any(str(c.user_id) == current_user["id"] for c in getattr(exam, 'collaborators', []))
    if current_user["role"] != "admin" and not is_owner and not is_collaborator:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    if exam.status != "draft":
        raise HTTPException(status_code=409, detail="Cannot modify published exam")
        
    return await generate_exam_from_bank(db, exam_id, request, current_user["token"])
