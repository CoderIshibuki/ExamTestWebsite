from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from uuid import UUID

from database import get_db
from dependencies import get_current_user, require_teacher_or_admin
from models import Violation
from schemas import ViolationCreate, ViolationResponse, EventLogResponse, RiskResponse, ResetRequest
from services.risk_engine import calculate_risk_and_alert

router = APIRouter(tags=["Proctoring"])

@router.post("/events", response_model=EventLogResponse)
async def log_event(
    event: ViolationCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    violation = Violation(
        exam_id=event.exam_id,
        exam_session_id=event.exam_session_id,
        user_id=current_user["id"],
        type=event.type,
        severity=event.severity,
        details=event.details,
        screenshot_url=event.screenshot_url,
        device_info=event.device_info
    )
    
    db.add(violation)
    await db.flush()
    
    current_risk_score = await calculate_risk_and_alert(
        db, 
        event.exam_id, 
        current_user["id"], 
        violation.id,
        violation.severity
    )
    
    violation.risk_score_at_event = current_risk_score
    await db.commit()
    await db.refresh(violation)
    
    return {"violation": violation, "current_risk_score": current_risk_score}

@router.get("/exams/{exam_id}/violations", response_model=List[ViolationResponse])
async def list_violations(
    exam_id: UUID,
    user_id: Optional[str] = None,
    severity: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    query = select(Violation).where(Violation.exam_id == exam_id)
    
    if user_id:
        query = query.where(Violation.user_id == user_id)
    if severity:
        query = query.where(Violation.severity == severity)
        
    query = query.order_by(desc(Violation.timestamp)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    violations = result.scalars().all()
    return violations

@router.get("/risk/{exam_id}/{user_id}", response_model=RiskResponse)
async def get_risk_score(
    exam_id: UUID,
    user_id: str,
    current_user: dict = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    from datetime import datetime, timedelta, timezone
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    query = select(Violation).where(
        Violation.exam_id == exam_id,
        Violation.user_id == user_id,
        Violation.timestamp >= five_mins_ago
    ).order_by(desc(Violation.timestamp))
    
    result = await db.execute(query)
    violations = result.scalars().all()
    
    score = 0
    weights = {"critical": 10, "high": 5, "medium": 2, "low": 1}
    for v in violations:
        score += weights.get(v.severity, 0)
        
    last_violation_at = violations[0].timestamp if violations else None
    
    return {
        "risk_score": score,
        "violation_count": len(violations),
        "last_violation_at": last_violation_at
    }

@router.post("/reset")
async def reset_risk_score(
    request: ResetRequest,
    current_user: dict = Depends(require_teacher_or_admin),
    db: AsyncSession = Depends(get_db)
):
    return {"status": "reset"}
