from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import grading, statistics
from contextlib import asynccontextmanager
from database import engine
import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield

app = FastAPI(title="Grading Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(grading.router)
app.include_router(statistics.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
