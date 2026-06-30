import asyncio
import json
import random
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.system import DistributedSystem, SystemStatus
from app.models.alert import Alert, AlertStatus

router = APIRouter(tags=["websocket"])


def _jitter(value: float, pct: float = 0.1) -> float:
    delta = value * pct
    return round(value + random.uniform(-delta, delta), 2)


async def _build_system_update(session) -> dict:
    result = await session.execute(select(DistributedSystem))
    systems = result.scalars().all()
    if not systems:
        return {}
    system = random.choice(systems)
    new_latency = _jitter(system.latency_ms if system.latency_ms > 0 else 50.0)
    return {
        "type": "system_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "id": system.id,
            "name": system.name,
            "status": system.status.value,
            "latency_ms": new_latency,
            "last_heartbeat": datetime.utcnow().isoformat(),
            "region": system.region,
            "environment": system.environment.value,
        },
    }


async def _build_alert_update(session) -> dict:
    result = await session.execute(
        select(Alert).where(Alert.status != AlertStatus.resolved).limit(20)
    )
    alerts = result.scalars().all()
    if not alerts:
        return {}
    alert = random.choice(alerts)
    return {
        "type": "alert_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "id": alert.id,
            "title": alert.title,
            "severity": alert.severity.value,
            "status": alert.status.value,
            "source_system_id": alert.source_system_id,
            "created_at": alert.created_at.isoformat(),
        },
    }


async def _build_metric_update(session) -> dict:
    result = await session.execute(select(DistributedSystem))
    systems = result.scalars().all()
    if not systems:
        return {}
    system = random.choice(systems)
    return {
        "type": "metric_update",
        "timestamp": datetime.utcnow().isoformat(),
        "data": {
            "system_id": system.id,
            "system_name": system.name,
            "latency_ms": _jitter(system.latency_ms if system.latency_ms > 0 else 50.0),
            "request_count": random.randint(100, 5000),
            "error_rate": round(random.uniform(0.0, 0.05), 4),
            "heartbeat_age_seconds": round(random.uniform(1.0, 30.0), 1),
        },
    }


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            async with AsyncSessionLocal() as session:
                event_builders = [_build_system_update, _build_alert_update, _build_metric_update]
                builder = random.choice(event_builders)
                event = await builder(session)

            if event:
                await websocket.send_text(json.dumps(event))

            await asyncio.sleep(3)
    except WebSocketDisconnect:
        pass
    except Exception:
        await websocket.close()
