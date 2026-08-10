import asyncio
import logging
from uuid import UUID
from datetime import datetime, timezone
from typing import Dict, Any

from sqlalchemy import update
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from .celery_app import celery_app
from services.grading_engine import GradingEngine
from services.exam_client import ExamClient
from models import Result, QuestionResult, Submission
from config import settings

logger = logging.getLogger(__name__)

import os
from jose import jwt

def _make_session_maker():
    """Create a fresh engine and session maker for use within a single asyncio.run() call."""
    eng = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=2, max_overflow=0)
    return async_sessionmaker(eng, expire_on_commit=False, class_=AsyncSession), eng

async def get_exam_questions(exam_id: str):
    client = ExamClient()
    token = os.environ.get("JWT_SECRET", "default_secret")
    # Using the JWT_SECRET directly as the internal service token
    return await client.get_exam_questions(exam_id, token)

async def update_submission_status(session_maker, submission_id: str, status_msg: str, error_msg: str = None):
    async with session_maker() as session:
        try:
            stmt = update(Submission).where(Submission.id == UUID(submission_id)).values(
                processed=True if status_msg == "processed" else False
            )
            await session.execute(stmt)
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to update submission status: {e}")

async def save_result(session_maker, exam_id: str, user_id: str, result_data: dict, started_at: datetime, attempt_id: str = None):
    async with session_maker() as session:
        try:
            # Create Result
            db_result = Result(
                attempt_id=UUID(attempt_id) if attempt_id else None,
                exam_id=UUID(exam_id),
                user_id=user_id,
                score=result_data["score"],
                total_possible=result_data["total_possible"],
                percentage=result_data["percentage"],
                correct_count=result_data["correct_count"],
                incorrect_count=result_data["incorrect_count"],
                started_at=started_at,
                submitted_at=datetime.now(timezone.utc),
                status="graded",
                has_pending_manual_grading=result_data.get("has_pending_manual_grading", False),
                grading_started_at=datetime.now(timezone.utc),
                grading_completed_at=datetime.now(timezone.utc)
            )
            session.add(db_result)
            await session.flush() # flush to get result ID

            # Create QuestionResults
            for qr in result_data["question_results"]:
                db_qr = QuestionResult(
                    result_id=db_result.id,
                    question_id=qr["question_id"],
                    user_answer=qr["user_answer"],
                    is_correct=qr["is_correct"],
                    point_earned=qr["point_earned"],
                    point_possible=qr["point_possible"],
                    needs_manual_grading=qr.get("needs_manual_grading", False)
                )
                session.add(db_qr)
                
            await session.commit()
        except Exception as e:
            logger.error(f"Failed to save result: {e}")
            await session.rollback()
            raise

async def process_grading(submission_id: str, exam_id: str, user_id: str, answers: dict, started_at: datetime = None, metadata_info: dict = None):
    # Create a fresh engine/session for this event loop
    sm, eng = _make_session_maker()
    
    try:
        # 1. Lấy danh sách câu hỏi của exam
        questions = await get_exam_questions(exam_id)
        
        # 2. Chấm điểm
        engine = GradingEngine(questions)
        result = engine.grade(answers)
        
        # 3. Lưu kết quả vào database
        attempt_id = metadata_info.get("attempt_id") if metadata_info else None
        await save_result(sm, exam_id, user_id, result, started_at, attempt_id)
        
        # 4. Cập nhật trạng thái
        await update_submission_status(sm, submission_id, "processed")
        
        # 5. Cập nhật ExamAttempt sang graded
        if metadata_info and metadata_info.get("attempt_id"):
            attempt_id = metadata_info.get("attempt_id")
            from sqlalchemy import text
            async with sm() as session:
                try:
                    await session.execute(
                        text("UPDATE exam_attempts SET status='graded' WHERE id = :attempt_id"),
                        {"attempt_id": attempt_id}
                    )
                    await session.commit()
                except Exception as e:
                    logger.error(f"Failed to update exam_attempts: {e}")
                    
        return result
    finally:
        await eng.dispose()

@celery_app.task(
    bind=True, 
    max_retries=3, 
    default_retry_delay=5,
    acks_late=True,
    reject_on_worker_lost=True
)
def grade_exam(self, submission_id: str, exam_id: str, user_id: str, answers: dict, started_at: str = None, metadata_info: dict = None):
    """Task chấm điểm bất đồng bộ"""
    try:
        dt_started_at = datetime.fromisoformat(started_at) if started_at else None
        
        result = asyncio.run(
            process_grading(submission_id, exam_id, user_id, answers, dt_started_at, metadata_info)
        )
        return {"status": "success", "result": result}
        
    except Exception as e:
        logger.error(f"Grading failed: {e}. Retrying...")
        sm, eng = _make_session_maker()
        try:
            asyncio.run(update_submission_status(sm, submission_id, "failed", str(e)))
        except Exception:
            pass
        raise self.retry(exc=e)

