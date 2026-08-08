from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from datetime import datetime, timezone

import schemas, models
from database import get_db
from dependencies import get_current_user
from tasks.grading_tasks import grade_exam

router = APIRouter(prefix="/api/v1/grading", tags=["Grading"])

@router.post("/submit", response_model=schemas.SubmissionResponse)
async def submit_exam(
    submission: schemas.SubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if str(submission.user_id) != current_user["id"] and current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Cannot submit for another user")
        
    # Check if result already exists
    stmt = select(models.Result).where(
        models.Result.exam_id == submission.exam_id,
        models.Result.user_id == submission.user_id
    )
    result = await db.execute(stmt)
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Exam already submitted")

    # Create submission record
    db_submission = models.Submission(
        exam_id=submission.exam_id,
        user_id=submission.user_id,
        answers=submission.answers,
        metadata_info=submission.metadata_info
    )
    db.add(db_submission)
    await db.commit()
    await db.refresh(db_submission)

    # Queue Celery task
    # Note: We pass started_at if we had it, but for now just pass None
    grade_exam.delay(
        str(db_submission.id),
        str(submission.exam_id),
        str(submission.user_id),
        submission.answers,
        None
    )

    return {
        "submission_id": str(db_submission.id),
        "status": "processing",
        "message": "Exam submitted and is being graded."
    }

@router.get("/result/{exam_id}/{user_id}", response_model=schemas.ResultResponse)
async def get_exam_result(
    exam_id: UUID,
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if str(user_id) != current_user["id"] and current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    stmt = select(models.Result).where(
        models.Result.exam_id == exam_id,
        models.Result.user_id == user_id
    )
    result = await db.execute(stmt)
    db_result = result.scalars().first()
    
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found or not graded yet")
        
    return db_result

@router.get("/status/{submission_id}")
async def get_submission_status(
    submission_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt = select(models.Submission).where(models.Submission.id == submission_id)
    result = await db.execute(stmt)
    submission = result.scalars().first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if str(submission.user_id) != current_user["id"] and current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return {
        "submission_id": submission.id,
        "processed": submission.processed
    }
