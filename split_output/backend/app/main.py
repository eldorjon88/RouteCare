"""RouteCare FastAPI application (replaces backend/server.js).

Wires up CORS, rate limiting, API routers, the WebSocket endpoint, static
frontend serving, and error handlers that keep the {"error": ...} response shape
the existing frontend expects.
"""
import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import CORS_ORIGIN
from .rate_limit import limiter
from .routers import auth, calls, drivers
from .websocket import manager

app = FastAPI(title="RouteCare API")

# --- Rate limiting (replaces express-rate-limit) ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- CORS ---
origins = ["*"] if CORS_ORIGIN == "*" else [o.strip() for o in CORS_ORIGIN.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Error handlers: keep the {"error": ...} shape the frontend reads ---
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    return JSONResponse(status_code=400, content={"error": "Invalid request", "details": exc.errors()})


# --- Health check (no DB dependency) ---
@app.get("/health")
def health():
    return {"status": "ok", "service": "routecare", "time": datetime.now(timezone.utc).isoformat()}


# --- API routers ---
app.include_router(auth.router)
app.include_router(calls.router)
app.include_router(drivers.router)


# --- WebSocket (replaces Socket.io) ---
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            raw = await ws.receive_text()
            try:
                message = json.loads(raw)
            except (ValueError, TypeError):
                continue
            event = message.get("event")
            data = message.get("data")

            if event == "call:subscribe":
                manager.join(f"call:{data}", ws)
            elif event == "location:update":
                if isinstance(data, dict) and data.get("callId"):
                    await manager.send_to_room(f"call:{data['callId']}", "location:update", data)
                await manager.broadcast("location:update", data)
    except WebSocketDisconnect:
        manager.disconnect(ws)


# --- Static frontend (only if present; the split backend is API-only) ---
_frontend_dir = Path(__file__).resolve().parent.parent / "frontend"
if _frontend_dir.is_dir():
    app.mount("/", StaticFiles(directory=str(_frontend_dir), html=True), name="frontend")

# --- Admin dashboard (bundled with the backend after the project split) ---
_admin_dir = Path(__file__).resolve().parent.parent / "admin"
if _admin_dir.is_dir():
    app.mount("/admin", StaticFiles(directory=str(_admin_dir), html=True), name="admin")
