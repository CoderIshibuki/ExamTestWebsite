from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import socketio
from services.redis_client import redis_client
from services.pubsub_manager import pubsub_manager
from handlers.connection import register_connection_handlers
from handlers.message_handlers import register_message_handlers
from handlers.broadcast import handle_broadcast
from config import settings
from dependencies import validate_token

app = FastAPI(title="Real-time Service")

# Setup Socket.IO Server
# We use async_mode='asgi' for FastAPI integration
# logger=True and engineio_logger=True can be enabled for debugging
origins_str = os.getenv("CORS_ORIGINS", '["http://localhost:3000", "http://localhost:5173"]')
try:
    origins = json.loads(origins_str)
except Exception:
    origins = []
if "http://localhost:5173" not in origins:
    origins.append("http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins=origins)

# Mount Socket.IO to FastAPI app
socket_app = socketio.ASGIApp(sio, socketio_path="/")
app.mount("/ws", socket_app)

# Register event handlers
register_connection_handlers(sio)
register_message_handlers(sio)

@app.on_event("startup")
async def startup_event():
    # Set the broadcast callback
    pubsub_manager.set_callback(lambda exam_id, event, data: handle_broadcast(sio, exam_id, event, data))

@app.on_event("shutdown")
async def shutdown_event():
    await redis_client.close()

@app.get("/health")
async def health_check():
    return {"status": "ok"}

from typing import Optional

class ProctorAlert(BaseModel):
    exam_id: str
    user_id: str
    severity: str
    message: str
    violation_id: str
    type: Optional[str] = "violation"
    risk_score: Optional[int] = 0
    timestamp: Optional[str] = None
    details: Optional[dict] = None

def require_internal_token(x_internal_token: str = Header(None)):
    if not x_internal_token or x_internal_token != settings.JWT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid internal service token")
    return True


def require_staff_bearer(authorization: str = Header(None)):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        user = validate_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.get("role") not in ("admin", "teacher", "proctor"):
        raise HTTPException(status_code=403, detail="Only proctors can view this")
    return user


@app.post("/api/v1/realtime/alert")
async def broadcast_alert(alert: ProctorAlert, _: bool = Depends(require_internal_token)):
    payload = alert.dict()
    await sio.emit("proctor:violation", payload, room=f"proctor:{alert.exam_id}")
    await sio.emit("proctor:risk_update", {"exam_id": alert.exam_id, "user_id": alert.user_id, "risk_score": alert.risk_score}, room=f"proctor:{alert.exam_id}")
    if alert.severity in ("high", "critical") or alert.risk_score >= 30:
        await sio.emit("proctor:alert", payload, room=f"proctor:{alert.exam_id}")
    return {"status": "alert_broadcasted"}

@app.get("/api/v1/realtime/exams/{exam_id}/students")
async def get_exam_students(exam_id: str, _: dict = Depends(require_staff_bearer)):
    import json
    client = await redis_client.get_client()
    clients_set = await client.smembers(f"exam:room:{exam_id}:clients")
    students_list = []
    user_ids = []
    for c in clients_set:
        uid = c if isinstance(c, str) else c.decode('utf-8')
        user_ids.append(uid)
        info_json = await client.get(f"exam:room:{exam_id}:student_info:{uid}")
        if info_json:
            try:
                info = json.loads(info_json if isinstance(info_json, str) else info_json.decode('utf-8'))
                students_list.append(info)
            except Exception:
                students_list.append({"user_id": uid})
        else:
            students_list.append({"user_id": uid})
    return {"exam_id": exam_id, "online_students": user_ids, "students": students_list}
