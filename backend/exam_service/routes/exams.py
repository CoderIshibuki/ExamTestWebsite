from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import datetime, timezone
import crud, schemas
from database import get_db
from dependencies import get_current_user, require_permission, require_internal_token
import os
from services.cache import CacheService

redis_url = os.getenv("REDIS_URL", "redis://redis_cache:6379")
cache = CacheService(redis_url)

router = APIRouter(prefix="/api/v1/exams", tags=["Exams"])

@router.get("/", response_model=List[schemas.ExamResponse])
async def list_exams(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    role = current_user["role"]
    user_id = current_user["id"]
    
    async def fetch_data():
        exams = await crud.get_exams(db, skip=skip, limit=limit)
        if role == "admin":
            return exams
        
        filtered = []
        for exam in exams:
            if role == "teacher":
                is_owner = str(exam.owner_id) == user_id
                is_collab = any(str(c.user_id) == user_id for c in exam.collaborators)
                if is_owner or is_collab:
                    filtered.append(exam)
            elif role == "student":
                if exam.status == "published":
                    is_roster = any(str(r.user_id) == user_id for r in exam.roster)
                    if getattr(exam, 'is_public', False) or is_roster:
                        filtered.append(exam)
            elif role == "proctor":
                is_proctor = any(str(p.user_id) == user_id for p in exam.proctors)
                if is_proctor:
                    filtered.append(exam)
        return filtered
    
    key = f"exams:list:{role}:{user_id}:{skip}:{limit}"
    return await cache.get_or_set(key, fetch_data, ttl=300)

@router.post("/", response_model=schemas.ExamResponse, status_code=status.HTTP_201_CREATED)
async def create_exam(
    exam: schemas.ExamCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:create"))
):
    new_exam = await crud.create_exam(db, exam, current_user["id"])
    await cache.invalidate_pattern("exams:list:*")
    return new_exam

@router.get("/stats/overview")
async def get_exam_stats_overview(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:read"))
):
    from sqlalchemy import text
    import httpx
    from config import settings

    total_exams = await crud.count_exams(db)

    # users và results nằm trong cùng database vật lý "exam_db" (xem docker-compose.yml)
    # nên có thể truy vấn trực tiếp bằng raw SQL, giống cách proctoring_service đang làm
    # với bảng exams/exam_proctors — không cần gọi HTTP sang service khác.
    total_users = (await db.execute(text("SELECT COUNT(*) FROM users"))).scalar() or 0
    total_results = (await db.execute(text("SELECT COUNT(*) FROM results"))).scalar() or 0

    # question_service dùng MongoDB (không cùng DB vật lý) nên phải gọi HTTP.
    total_questions = 0
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            res = await client.get(f"{settings.QUESTION_SERVICE_URL}/api/v1/questions", params={"limit": 1})
            if res.status_code == 200:
                total_questions = res.json().get("total", 0)
    except Exception:
        pass  # question_service tạm thời không phản hồi — không chặn cả trang dashboard vì lý do này

    # Biểu đồ 14 ngày gần nhất — khớp đúng dataKey "users"/"exams" mà AdminDashboard đang vẽ
    # (Line name="Người dùng mới" dataKey="users", Line name="Kỳ thi mới" dataKey="exams").
    users_by_day = (await db.execute(text(
        """
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM users WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        """
    ))).all()
    exams_by_day = (await db.execute(text(
        """
        SELECT DATE(created_at) AS day, COUNT(*) AS count
        FROM exams WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        """
    ))).all()

    users_map = {str(r.day): r.count for r in users_by_day}
    exams_map = {str(r.day): r.count for r in exams_by_day}
    all_days = sorted(set(users_map.keys()) | set(exams_map.keys()))
    chart = [{"name": d, "users": users_map.get(d, 0), "exams": exams_map.get(d, 0)} for d in all_days]

    return {
        "total_exams": total_exams,
        "total_questions": total_questions,
        "total_users": total_users,
        "total_results": total_results,
        "chart": chart,
    }

@router.get("/stats/reports")
async def get_exam_reports(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:read"))
):
    from sqlalchemy import text

    # Pass/fail thật: so sánh results.percentage (bảng cùng DB vật lý, thuộc grading_service)
    # với exam.passing_score — trước đây dùng status == 'GRADED' làm tiêu chí pass/fail,
    # hoàn toàn sai bản chất (đã "graded" không có nghĩa là "đạt").
    #
    # Giáo viên chỉ xem báo cáo của đề thi CHÍNH MÌNH tạo (owner_id) — trước đây route này
    # luôn trả về tất cả đề thi trong hệ thống bất kể ai gọi, khiến giáo viên nhìn thấy cả
    # dữ liệu của giáo viên khác. Admin vẫn xem được toàn bộ.
    where_owner = "" if current_user["role"] == "admin" else "WHERE e.owner_id = :owner_id"
    rows = (await db.execute(text(
        f"""
        SELECT e.title AS title,
               COUNT(r.id) AS total,
               SUM(CASE WHEN r.percentage >= e.passing_score THEN 1 ELSE 0 END) AS passed
        FROM exams e
        LEFT JOIN results r ON r.exam_id = e.id AND r.status = 'graded'
        {where_owner}
        GROUP BY e.id, e.title
        HAVING COUNT(r.id) > 0
        ORDER BY e.title
        """
    ), {"owner_id": current_user["id"]} if where_owner else {})).all()

    reports = [
        {
            "name": row.title or "Unknown",
            "pass": int(row.passed or 0),
            "fail": int(row.total or 0) - int(row.passed or 0),
        }
        for row in rows
    ]

    return {"data": reports}



@router.get("/{exam_id}", response_model=schemas.ExamResponse)
async def get_exam(exam_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    async def fetch_data():
        return await crud.get_exam_by_id(db, exam_id)
    
    # We shouldn't cache unauthorized access, so fetch the exam first.
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    role = current_user["role"]
    if role == "admin":
        pass # Admin can read any exam
    elif role == "teacher":
        is_owner = str(exam.owner_id) == current_user["id"]
        is_collaborator = any(str(c.user_id) == current_user["id"] for c in exam.collaborators)
        if not is_owner and not is_collaborator:
            raise HTTPException(status_code=403, detail="Not authorized to view this exam")
    elif role == "proctor":
        is_proctor = any(str(p.user_id) == current_user["id"] for p in getattr(exam, 'proctors', []))
        if not is_proctor:
            raise HTTPException(status_code=403, detail="Not authorized to view this exam")
    elif role == "student":
        if exam.status != "published":
            raise HTTPException(status_code=404, detail="Exam not found") # Drafts are hidden from students
        is_roster = any(str(r.user_id) == current_user["id"] for r in getattr(exam, 'roster', []))
        if not getattr(exam, 'is_public', False) and not is_roster:
            raise HTTPException(status_code=403, detail="Not authorized to view this private exam")
            
    return exam

@router.get("/{exam_id}/verify-access")
async def verify_exam_access(exam_id: str, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Internal API used by other services to check ownership
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    is_owner = str(exam.owner_id) == current_user["id"]
    is_collaborator = any(str(c.user_id) == current_user["id"] for c in getattr(exam, 'collaborators', []))
    is_proctor = any(str(p.user_id) == current_user["id"] for p in getattr(exam, 'proctors', []))
    is_roster = any(str(r.user_id) == current_user["id"] for r in getattr(exam, 'roster', []))
    
    return {
        "is_owner": is_owner,
        "is_collaborator": is_collaborator,
        "is_proctor": is_proctor,
        "is_roster": is_roster,
        "is_public": getattr(exam, 'is_public', False),
        "status": exam.status
    }

@router.put("/{exam_id}", response_model=schemas.ExamResponse)
async def update_exam(
    exam_id: str,
    exam_update: schemas.ExamUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:update"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    is_owner = str(exam.owner_id) == current_user["id"]
    is_collaborator = any(str(c.user_id) == current_user["id"] for c in exam.collaborators)
    if current_user["role"] != "admin" and not is_owner and not is_collaborator:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    if exam.status == "published":
        dump = exam_update.model_dump(exclude_unset=True)
        if any(k in dump for k in ["duration_minutes", "passing_score"]):
            raise HTTPException(status_code=400, detail="Cannot modify duration or passing score of a published exam")
        
    updated = await crud.update_exam(db, exam_id, exam_update)
    await cache.invalidate_pattern("exams:list:*")
    await cache.invalidate(f"exam:{exam_id}")
    return updated

@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:delete"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    is_owner = str(exam.owner_id) == current_user["id"]
    if current_user["role"] != "admin" and not is_owner:
        raise HTTPException(status_code=403, detail="You don't have permission. Only owners can delete.")
        
    await crud.delete_exam(db, exam_id)
    await cache.invalidate_pattern("exams:list:*")
    await cache.invalidate(f"exam:{exam_id}")

@router.post("/{exam_id}/publish", response_model=schemas.ExamResponse)
async def publish_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("exam:publish"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    is_owner = str(exam.owner_id) == current_user["id"]
    is_collaborator = any(str(c.user_id) == current_user["id"] for c in exam.collaborators)
    if current_user["role"] != "admin" and not is_owner and not is_collaborator:
        raise HTTPException(status_code=403, detail="You don't have permission")
        
    if exam.status != "draft":
        raise HTTPException(status_code=409, detail="Only draft exams can be published")

    question_ids = [str(q.question_id) for q in exam.questions]
    if not question_ids:
        raise HTTPException(status_code=400, detail="Đề thi chưa có câu hỏi nào, không thể công bố. Vui lòng thêm câu hỏi trước.")

    import httpx
    from config import settings
    from jose import jwt

    # Fetch questions from question_service
    snapshots_data = []
    
    if question_ids:
        try:
            async with httpx.AsyncClient() as client:
                token = jwt.encode({"sub": current_user["id"]}, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
                headers = {"Authorization": f"Bearer {token}"}
                for i, q_id in enumerate(question_ids):
                    res = await client.get(f"{settings.QUESTION_SERVICE_URL}/api/v1/questions/{q_id}", headers=headers)
                    if res.status_code == 200:
                        q_data = res.json()
                        # QuestionResponse thật trả về content.text (không phải "question_text") và
                        # options (không phải "choices") — mapping sai trước đây khiến snapshot luôn
                        # rỗng, và thiếu "type" khiến grading_engine luôn chấm 0 điểm cho mọi câu hỏi.
                        snapshots_data.append({
                            "exam_id": str(exam.id),
                            "question_id": str(q_id),
                            "question_version": 1,
                            "question_text": (q_data.get("content") or {}).get("text", ""),
                            "type": q_data.get("type", "multiple_choice"),
                            "choices": q_data.get("options", []),
                            "correct_answer": q_data.get("correct_answer", ""),
                            "points": exam.questions[i].point_value if hasattr(exam.questions[i], 'point_value') else 1.0,
                            "display_order": exam.questions[i].question_order if exam.questions[i].question_order is not None else i
                        })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching questions: {e}")
            
    if snapshots_data:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(
                    f"{settings.QUESTION_SERVICE_URL}/api/v1/snapshots/bulk",
                    json=snapshots_data,
                    headers={"X-Internal-Token": settings.JWT_SECRET}
                )
                if res.status_code != 201:
                    raise HTTPException(status_code=500, detail=f"Error saving snapshots: {res.text}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error saving snapshots to question service: {e}")

    update_data = schemas.ExamUpdate(status="published")
    updated = await crud.update_exam(db, exam_id, update_data)
    await cache.invalidate_pattern("exams:list:*")
    await cache.invalidate(f"exam:{exam_id}")
    return updated

@router.get("/{exam_id}/snapshots")
async def get_exam_snapshots(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    internal_valid: bool = Depends(require_internal_token)
):
    # This endpoint is strictly for grading service
    
    snapshots = await crud.get_exam_snapshots(db, exam_id)
    return snapshots

@router.post("/{exam_id}/start", response_model=schemas.ExamAttemptResponse)
async def start_exam(
    exam_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_permission("attempt:create"))
):
    exam = await crud.get_exam_by_id(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
        
    if exam.status != "published":
        raise HTTPException(status_code=400, detail="Exam is not published yet")

    is_on_roster = any(str(r.user_id) == current_user["id"] for r in exam.roster)
    if not getattr(exam, 'is_public', False) and not is_on_roster:
        raise HTTPException(status_code=403, detail="You are not on the roster for this private exam")

    # Nếu đề thi có đặt lịch (exam_schedules), chỉ cho phép bắt đầu làm bài trong khung giờ đó.
    # Trước đây endpoint POST /schedule chỉ lưu lịch vào DB nhưng không có nơi nào kiểm tra lại,
    # khiến tính năng "lịch thi" hoàn toàn không có tác dụng — học sinh vào thi được bất cứ lúc nào.
    if exam.schedules:
        now = datetime.now(timezone.utc)
        in_window = any(s.start_time <= now <= s.end_time for s in exam.schedules)
        if not in_window:
            upcoming = min((s.start_time for s in exam.schedules if s.start_time > now), default=None)
            detail = "Đề thi hiện không trong khung giờ được phép làm bài."
            if upcoming:
                detail += f" Kỳ thi tiếp theo mở lúc {upcoming.isoformat()}."
            raise HTTPException(status_code=403, detail=detail)

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
    current_user: dict = Depends(require_permission("attempt:answer"))
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
    current_user: dict = Depends(require_permission("attempt:submit"))
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
            # Use internal service token
            headers = {"X-Internal-Token": settings.JWT_SECRET}
            await client.post(f"{settings.GRADING_SERVICE_URL}/api/v1/grading/submit", json=payload, headers=headers)
    except Exception as e:
        print(f"Error calling grading service: {e}")
        
    return submitted_attempt
