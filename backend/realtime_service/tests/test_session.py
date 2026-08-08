import pytest
from datetime import datetime
from models.session import ExamSession

def test_session_creation():
    session = ExamSession(
        session_id="test-123",
        exam_id="exam-456",
        user_id="user-789",
        started_at=datetime.utcnow(),
        total_questions=10,
        last_heartbeat=datetime.utcnow()
    )
    assert session.status == "in_progress"
    assert session.current_question == 0

def test_update_answer():
    session = ExamSession(
        session_id="test-123",
        exam_id="exam-456",
        user_id="user-789",
        started_at=datetime.utcnow(),
        total_questions=10,
        last_heartbeat=datetime.utcnow()
    )
    session.answers["0"] = "A"
    session.current_question = 1
    
    assert session.answers["0"] == "A"
    assert session.current_question == 1
