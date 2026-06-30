import structlog
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "rail-logistics-control-plane"}
