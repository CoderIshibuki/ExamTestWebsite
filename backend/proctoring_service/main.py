from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import proctoring
from contextlib import asynccontextmanager
from database import engine
import models

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield

app = FastAPI(title="Proctoring Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(proctoring.router, prefix="/api/v1/proctoring")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "proctoring_service"}
