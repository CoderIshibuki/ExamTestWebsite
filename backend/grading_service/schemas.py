from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from datetime import datetime
from uuid import UUID

class SubmissionCreate(BaseModel):
    exam_id: UUID
    user_id: str
    answers: Dict[str, str]
    metadata_info: Optional[Dict] = None

class QuestionResultSchema(BaseModel):
    question_id: str
    user_answer: Optional[str]
    is_correct: bool
    point_earned: float
    point_possible: float

class GradingResult(BaseModel):
    score: float
    total_possible: float
    percentage: float
    correct_count: int
    incorrect_count: int
    question_results: List[QuestionResultSchema]

class ResultResponse(BaseModel):
    id: UUID
    exam_id: UUID
    user_id: str
    score: Optional[float]
    total_possible: Optional[float]
    percentage: Optional[float]
    correct_count: Optional[int]
    incorrect_count: Optional[int]
    time_taken: Optional[int]
    status: str
    started_at: Optional[datetime]
    submitted_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubmissionResponse(BaseModel):
    submission_id: str
    status: str
    message: str
