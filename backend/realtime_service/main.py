from fastapi import FastAPI
from pydantic import BaseModel
import socketio
from services.redis_client import redis_client
from services.pubsub_manager import pubsub_manager
from handlers.connection import register_connection_handlers
from handlers.message_handlers import register_message_handlers
from handlers.broadcast import handle_broadcast

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

class ProctorAlert(BaseModel):
    exam_id: str
    user_id: str
    severity: str
    message: str
    violation_id: str

@app.post("/api/v1/realtime/alert")
async def broadcast_alert(alert: ProctorAlert):
    payload = alert.dict()
    await sio.emit("proctor:alert", payload, room=f"proctor:{alert.exam_id}")
    return {"status": "alert_broadcasted"}

@app.get("/api/v1/realtime/exams/{exam_id}/students")
async def get_exam_students(exam_id: str):
    client = await redis_client.get_client()
    clients_set = await client.smembers(f"exam:room:{exam_id}:clients")
    user_ids = [c.decode('utf-8') for c in clients_set]
    return {"exam_id": exam_id, "online_students": user_ids}
