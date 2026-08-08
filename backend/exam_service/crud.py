from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import models, schemas
from uuid import UUID

# --- Exams ---
async def create_exam(db: AsyncSession, exam: schemas.ExamCreate, user_id: str) -> models.Exam:
    db_exam = models.Exam(**exam.model_dump(), created_by=user_id)
    db.add(db_exam)
    await db.commit()
    await db.refresh(db_exam)
    return db_exam

async def get_exams(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[models.Exam]:
    result = await db.execute(select(models.Exam).offset(skip).limit(limit))
    return result.scalars().all()

async def get_exam_by_id(db: AsyncSession, exam_id: str) -> Optional[models.Exam]:
    result = await db.execute(
        select(models.Exam)
        .options(selectinload(models.Exam.questions), selectinload(models.Exam.schedules), selectinload(models.Exam.assignments))
        .filter(models.Exam.id == UUID(exam_id))
    )
    return result.scalars().first()

async def update_exam(db: AsyncSession, exam_id: str, exam_update: schemas.ExamUpdate) -> Optional[models.Exam]:
    db_exam = await get_exam_by_id(db, exam_id)
    if not db_exam:
        return None
    
    update_data = exam_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exam, key, value)
        
    await db.commit()
    await db.refresh(db_exam)
    return db_exam

async def delete_exam(db: AsyncSession, exam_id: str) -> bool:
    db_exam = await get_exam_by_id(db, exam_id)
    if not db_exam:
        return False
    await db.delete(db_exam)
    await db.commit()
    return True

# --- Exam Questions ---
async def add_exam_question(db: AsyncSession, exam_id: str, question: schemas.ExamQuestionCreate) -> models.ExamQuestion:
    db_question = models.ExamQuestion(**question.model_dump(), exam_id=UUID(exam_id))
    db.add(db_question)
    await db.commit()
    await db.refresh(db_question)
    return db_question

async def delete_exam_question(db: AsyncSession, question_id: str) -> bool:
    result = await db.execute(select(models.ExamQuestion).filter(models.ExamQuestion.id == UUID(question_id)))
    db_question = result.scalars().first()
    if not db_question:
        return False
    await db.delete(db_question)
    await db.commit()
    return True

async def get_exam_questions(db: AsyncSession, exam_id: str) -> List[models.ExamQuestion]:
    result = await db.execute(
        select(models.ExamQuestion)
        .filter(models.ExamQuestion.exam_id == UUID(exam_id))
        .order_by(models.ExamQuestion.question_order)
    )
    return result.scalars().all()

# --- Exam Schedules ---
async def add_exam_schedule(db: AsyncSession, exam_id: str, schedule: schemas.ExamScheduleCreate) -> models.ExamSchedule:
    db_schedule = models.ExamSchedule(**schedule.model_dump(), exam_id=UUID(exam_id))
    db.add(db_schedule)
    await db.commit()
    await db.refresh(db_schedule)
    return db_schedule

# --- Exam Assignments ---
async def add_exam_assignment(db: AsyncSession, exam_id: str, assignment: schemas.ExamAssignmentCreate) -> models.ExamAssignment:
    db_assignment = models.ExamAssignment(**assignment.model_dump(), exam_id=UUID(exam_id))
    db_assignment.teacher_id = assignment.teacher_id
    db.add(db_assignment)
    await db.commit()
    await db.refresh(db_assignment)
    return db_assignment
