"""
app/main.py — FastAPI Application Entry Point
===============================================
Responsibility:
    Bootstrap the FastAPI application: register all route groups, configure
    CORS, set up the OpenAPI schema, and expose a working GET /health endpoint.
    This is the only fully-implemented file in the backend at scaffold time.

Inputs:  None (reads settings from core/config.py at startup)
Outputs: ASGI application object (`app`) importable by uvicorn

Run locally:
    cd backend
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logger import get_logger
from app.api.routes import upload, analyze, repair, verify, report

log = get_logger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Application factory
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="IoT ShieldAI API",
    description=(
        "AI-powered IoT firmware vulnerability detection, repair, and verification.\n\n"
        "**Pipeline:** Upload → M1 Detect → M2 Repair (template + LLM) → "
        "M3 Verify (compile + ASan + no-cheating) → M4 Explain + IoT metrics → Report"
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "IoT ShieldAI Team",
        "url": "https://github.com/your-org/iot-shieldai",
    },
    license_info={"name": "MIT"},
)

# ─────────────────────────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────────────────────
# Route registration
# ─────────────────────────────────────────────────────────────────────────────

API_PREFIX = "/api"

app.include_router(upload.router, prefix=API_PREFIX)
app.include_router(analyze.router, prefix=API_PREFIX)
app.include_router(repair.router, prefix=API_PREFIX)
app.include_router(verify.router, prefix=API_PREFIX)
app.include_router(report.router, prefix=API_PREFIX)

# ─────────────────────────────────────────────────────────────────────────────
# Health endpoint (fully implemented)
# ─────────────────────────────────────────────────────────────────────────────

@app.get(
    "/health",
    tags=["Health"],
    summary="Health check",
    response_description="Service is healthy",
)
async def health_check() -> dict:
    """Return service health and basic metadata.

    This endpoint is always available and does not require authentication.
    It is used by Docker, load balancers, and the CI check_all script.

    Returns:
        dict with keys: status, version, environment, timestamp
    """
    log.info("health_check called")
    return {
        "status": "ok",
        "service": "iot-shieldai-api",
        "version": "0.1.0",
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Startup / shutdown events
# ─────────────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def on_startup() -> None:
    log.info(
        "IoT ShieldAI API starting",
        env=settings.app_env,
        llm_provider=settings.llm_provider,
        llm_model=settings.llm_model,
    )


@app.on_event("shutdown")
async def on_shutdown() -> None:
    log.info("IoT ShieldAI API shutting down")
