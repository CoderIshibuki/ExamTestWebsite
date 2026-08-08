from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID

import models
from database import get_db
from dependencies import get_current_user

import os
from services.cache import CacheService

redis_url = os.getenv("REDIS_URL", "redis://redis_cache:6379")
cache = CacheService(redis_url)

router = APIRouter(prefix="/api/v1/results", tags=["Results"])

@router.get("/{exam_id}")
async def get_results_by_exam(
    exam_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    async def fetch_data():
        stmt = select(models.Result).where(models.Result.exam_id == exam_id)
        result = await db.execute(stmt)
        results = result.scalars().all()
        return results

    key = f"results:exam:{exam_id}"
    return await cache.get_or_set(key, fetch_data, ttl=300)
