from fastapi import FastAPI
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
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

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
