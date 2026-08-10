from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
import crud, schemas
from database import get_db
from dependencies import get_current_user, require_permission
from services.exam_generator import generate_exam_from_bank

router = APIRouter(prefix="/api/v1/exams/{exam_id}", tags=["Exam Questions"])

@router.get("/questions", response_model=list[schemas.ExamQuestionDetail])
async def get_exam_questions(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")

    # crud.get_exam_questions chỉ trả về bảng tham chiếu (question_id, order, point_value),
    # KHÔNG có nội dung câu hỏi thật — phải gọi sang question_service để lấy đủ text/options/type.
    # Thiếu bước "làm giàu" (enrich) này trước đây khiến phòng thi không hiển thị được câu hỏi nào cả.
    refs = await crud.get_exam_questions(db, exam_id)
    if not refs:
        return []

    import httpx
    from jose import jwt
    from config import settings

    is_student = current_user["role"] == "student"
    token = jwt.encode({"sub": current_user["id"]}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    headers = {"Authorization": f"Bearer {token}"}

    results = []
    async with httpx.AsyncClient() as client:
        for ref in refs:
            try:
                res = await client.get(f"{settings.QUESTION_SERVICE_URL}/api/v1/questions/{ref.question_id}", headers=headers)
            except Exception:
                continue
            if res.status_code != 200:
                continue
            q = res.json()
            options = q.get("options", []) or []
            if is_student:
                # Không được lộ is_correct / correct_answer cho học sinh trong lúc đang thi
                options = [{"id": o.get("id"), "text": o.get("text")} for o in options]
            results.append({
                "id": str(ref.id),
                "question_id": ref.question_id,
                "question_order": ref.question_order,
                "point_value": ref.point_value,
                "type": q.get("type", "multiple_choice"),
                "content": q.get("content", {}) or {},
                "options": options,
                "correct_answer": None if is_student else q.get("correct_answer"),
            })
    results.sort(key=lambda r: (r["question_order"] if r["question_order"] is not None else 0))
    return results

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
