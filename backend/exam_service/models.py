from sqlalchemy import Column, String, Text, Integer, Boolean, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

class Exam(Base):
    __tablename__ = "exams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)
    passing_score = Column(Integer, default=0)
    max_attempts = Column(Integer, default=1)
    shuffle_questions = Column(Boolean, default=True)
    shuffle_options = Column(Boolean, default=True)
    show_result_after_submit = Column(Boolean, default=True)
    status = Column(String(20), default="draft")
    created_by = Column(UUID(as_uuid=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    questions = relationship("ExamQuestion", back_populates="exam", cascade="all, delete-orphan")
    schedules = relationship("ExamSchedule", back_populates="exam", cascade="all, delete-orphan")
    assignments = relationship("ExamAssignment", back_populates="exam", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_exams_status", "status"),
        Index("idx_exams_created_by", "created_by"),
    )

class ExamQuestion(Base):
    __tablename__ = "exam_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(64), nullable=False)
    question_order = Column(Integer, nullable=True)
    point_value = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="questions")

    __table_args__ = (
        Index("idx_exam_questions_exam_id", "exam_id"),
    )

class ExamSchedule(Base):
    __tablename__ = "exam_schedules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), default="UTC")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="schedules")

    __table_args__ = (
        Index("idx_exam_schedules_start_time", "start_time"),
        Index("idx_exam_schedules_end_time", "end_time"),
    )

class ExamAssignment(Base):
    __tablename__ = "exam_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_id = Column(UUID(as_uuid=True), ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(UUID(as_uuid=True), nullable=False)
    role = Column(String(20), default="proctor")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    exam = relationship("Exam", back_populates="assignments")

    __table_args__ = (
        Index("idx_exam_assignments_teacher_id", "teacher_id"),
    )
