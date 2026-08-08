import httpx
import logging
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

from models import Violation
from config import settings

logger = logging.getLogger(__name__)

SEVERITY_WEIGHTS = {
    "critical": 10,
    "high": 5,
    "medium": 2,
    "low": 1
}

RISK_THRESHOLD = 30

async def calculate_risk_and_alert(
    db: AsyncSession, 
    exam_id: UUID, 
    user_id: str, 
    current_violation_id: UUID,
    current_severity: str
) -> int:
    five_mins_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    query = select(Violation).where(
        Violation.exam_id == exam_id,
        Violation.user_id == user_id,
        Violation.timestamp >= five_mins_ago
    )
    
    result = await db.execute(query)
    recent_violations = result.scalars().all()
    
    score = 0
    current_found = False
    
    for v in recent_violations:
        if v.id == current_violation_id:
            current_found = True
        score += SEVERITY_WEIGHTS.get(v.severity, 0)
        
    if not current_found:
        score += SEVERITY_WEIGHTS.get(current_severity, 0)
        
    if score >= RISK_THRESHOLD:
        await send_alert(exam_id, user_id, current_violation_id)
        
    return score

async def send_alert(exam_id: UUID, user_id: str, violation_id: UUID):
    payload = {
        "exam_id": str(exam_id),
        "user_id": user_id,
        "severity": "high",
        "message": "Risk threshold exceeded",
        "violation_id": str(violation_id)
    }
    
    try:
        async with httpx.AsyncClient() as client:
            url = f"{settings.REALTIME_SERVICE_URL}/api/v1/realtime/alert"
            await client.post(url, json=payload, timeout=5.0)
    except Exception as e:
        logger.error(f"Failed to send alert to realtime service: {e}")
