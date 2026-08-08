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
    if current_user.get("role") != "system":
        raise HTTPException(status_code=403, detail="Direct grading submission not allowed. Internal route only.")
        
    # Check if result already exists for this attempt
    attempt_id = str(submission.attempt_id)
    
    stmt = select(models.Result).where(models.Result.attempt_id == UUID(attempt_id))
    result = await db.execute(stmt)
    if result.scalars().first():
        # Check if submission exists
        sub_stmt = select(models.Submission).where(models.Submission.attempt_id == UUID(attempt_id))
        sub_res = await db.execute(sub_stmt)
        existing_sub = sub_res.scalars().first()
        if existing_sub:
            return {
                "submission_id": str(existing_sub.id),
                "status": "already_processed",
                "message": "Attempt already graded"
            }
        else:
            raise HTTPException(status_code=400, detail="Attempt already graded but submission missing")

    # Check if submission already exists (idempotency)
    sub_stmt = select(models.Submission).where(models.Submission.attempt_id == UUID(attempt_id))
    sub_res = await db.execute(sub_stmt)
    existing_sub = sub_res.scalars().first()
    if existing_sub:
        return {
            "submission_id": str(existing_sub.id),
            "status": "already_submitted",
            "message": "Exam already submitted and is being graded."
        }

    # Create submission record
    db_submission = models.Submission(
        attempt_id=UUID(attempt_id),
        exam_id=submission.exam_id,
        user_id=submission.user_id,
        answers=submission.answers
    )
    db.add(db_submission)
    from sqlalchemy.exc import IntegrityError
    try:
        await db.commit()
        await db.refresh(db_submission)
    except IntegrityError:
        await db.rollback()
        # Race condition happened, return idempotently
        sub_stmt = select(models.Submission).where(models.Submission.attempt_id == UUID(attempt_id))
        sub_res = await db.execute(sub_stmt)
        existing_sub = sub_res.scalars().first()
        if existing_sub:
            return {
                "submission_id": str(existing_sub.id),
                "status": "already_submitted",
                "message": "Exam already submitted and is being graded."
            }
        raise HTTPException(status_code=500, detail="Database integrity error on submission")

    # Queue Celery task
    grade_exam.delay(
        str(db_submission.id),
        str(submission.exam_id),
        str(submission.user_id),
        submission.answers,
        None,
        {"attempt_id": attempt_id}
    )

    return {
        "submission_id": str(db_submission.id),
        "status": "processing",
        "message": "Exam submitted and is being graded."
    }

@router.get("/result/{attempt_id}", response_model=schemas.ResultResponse)
async def get_exam_result(
    attempt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    stmt = select(models.Result).where(
        models.Result.attempt_id == attempt_id
    )
    result = await db.execute(stmt)
    db_result = result.scalars().first()
    
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found or not graded yet")
        
    if str(db_result.user_id) != current_user["id"] and current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Access denied")
        
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
