from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import exams, questions, schedules, assignments

app = FastAPI(title="Exam Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exams.router)
app.include_router(questions.router)
app.include_router(schedules.router)
app.include_router(assignments.router)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
