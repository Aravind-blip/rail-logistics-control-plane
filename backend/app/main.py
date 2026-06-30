import structlog
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.middleware.audit import RequestLoggingMiddleware
from app.seed import seed_database

from app.routers import auth, systems, alerts, workflows, audit_logs, metrics, freight_risk, dashboard, websocket


# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
logging.basicConfig(level=logging.INFO)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("rail_logistics_startup", environment="boot")
    await init_db()
    async with AsyncSessionLocal() as db:
        await seed_database(db)
    logger.info("database_ready")
    yield
    logger.info("rail_logistics_shutdown")


app = FastAPI(
    title="Rail Logistics Control Plane",
    description="Simulated freight rail technology platform — realistic mock data only.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# Routers
app.include_router(auth.router)
app.include_router(systems.router)
app.include_router(alerts.router)
app.include_router(workflows.router)
app.include_router(audit_logs.router)
app.include_router(metrics.router)
app.include_router(freight_risk.router)
app.include_router(dashboard.router)
app.include_router(websocket.router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc = " → ".join(str(l) for l in err["loc"] if l != "body")
        errors.append({"field": loc or "request", "message": err["msg"]})
    logger.warning("request_validation_error", path=request.url.path, errors=errors)
    return JSONResponse(
        status_code=422,
        content={"detail": "Request validation failed", "errors": errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("unhandled_exception", path=request.url.path, error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again or contact support."},
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "rail-logistics-control-plane", "version": "1.0.0"}
