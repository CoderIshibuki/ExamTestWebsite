from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
import crud
import schemas
from dependencies import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=schemas.PaginatedQuestionResponse)
async def get_questions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    subject: Optional[str] = None,
    difficulty: Optional[str] = None,
    type: Optional[str] = None,
    category_id: Optional[str] = None
):
    filters = {
        "subject": subject,
        "difficulty": difficulty,
        "type": type,
        "category_id": category_id
    }
    total, items = await crud.get_questions(skip=skip, limit=limit, filters=filters)
    return {"total": total, "page": skip // limit + 1 if limit > 0 else 1, "size": limit, "items": items}

@router.post("/", response_model=schemas.QuestionResponse, status_code=status.HTTP_201_CREATED)
async def create_question(
    question: schemas.QuestionCreate,
    current_user: dict = Depends(require_role(["teacher", "admin"]))
):
    question_data = question.model_dump(exclude_unset=True)
    question_data["created_by"] = current_user.get("id")
    new_q = await crud.create_question(question_data)
    if not new_q:
        raise HTTPException(status_code=400, detail="Failed to create question")
    return new_q

@router.get("/{id}", response_model=schemas.QuestionResponse)
async def get_question(id: str):
    q = await crud.get_question(id)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    return q

@router.put("/{id}", response_model=schemas.QuestionResponse)
async def update_question(
    id: str,
    question: schemas.QuestionUpdate,
    current_user: dict = Depends(require_role(["teacher", "admin"]))
):
    update_data = question.model_dump(exclude_unset=True)
    q = await crud.update_question(id, update_data)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found or update failed")
    return q

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question(
    id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    success = await crud.delete_question(id)
    if not success:
        raise HTTPException(status_code=404, detail="Question not found")
    return None
