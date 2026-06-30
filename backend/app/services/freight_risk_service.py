import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.freight_risk import FreightRisk
from app.models.system import DistributedSystem, SystemStatus


async def compute_risk_for_system(system: DistributedSystem) -> dict:
    """Rule-based risk engine: derive delay probability from system status and latency."""
    if system.status == SystemStatus.offline:
        delay_prob = 0.85
        confidence = 0.92
        risk_factor = "System offline - no telemetry available"
        action = "Activate manual tracking protocol; notify dispatch supervisors immediately"
    elif system.status == SystemStatus.degraded:
        base = 0.45
        latency_penalty = min(0.30, system.latency_ms / 1000.0)
        delay_prob = round(base + latency_penalty, 2)
        confidence = 0.78
        risk_factor = f"Degraded system health with elevated latency ({system.latency_ms:.0f}ms)"
        action = "Schedule maintenance window; increase monitoring frequency to every 60 seconds"
    else:
        latency_penalty = min(0.15, system.latency_ms / 2000.0)
        delay_prob = round(0.08 + latency_penalty, 2)
        confidence = 0.95
        risk_factor = "Normal operating conditions with minor latency variance"
        action = "No action required; continue standard monitoring cadence"

    return {
        "delay_probability": delay_prob,
        "confidence_score": confidence,
        "primary_risk_factor": risk_factor,
        "recommended_action": action,
    }


async def refresh_freight_risks(db: AsyncSession) -> list[FreightRisk]:
    result = await db.execute(select(DistributedSystem))
    systems = result.scalars().all()

    corridor_map = {
        "Dispatch API": "Chicago - Kansas City Mainline",
        "Freight ETA Prediction Service": "Southern Transcon (LA - Chicago)",
        "Telemetry Collector": "Powder River Basin Coal Corridor",
        "Edge Gateway - Denver Yard": "Denver - Salt Lake City Mountain Crossing",
        "Edge Gateway - Fort Worth": "Sunset Route (LA - New Orleans)",
        "Crew Scheduling Adapter": "Great Plains Grain Shuttle",
        "Shipment Visibility API": "Gulf Coast Petrochemical Corridor",
        "Track Sensor Stream Processor": "Donner Pass Sierra Nevada Crossing",
        "Customer Notification Service": "Northeast Corridor Intermodal",
        "Railcar Routing Service": "Mississippi Valley North-South Corridor",
        "Data Center Batch Processor": "Kansas City Hub Interchange",
    }

    updated_risks = []
    for system in systems:
        corridor = corridor_map.get(system.name, f"{system.region} Corridor")
        risk_data = await compute_risk_for_system(system)

        existing = await db.execute(
            select(FreightRisk).where(FreightRisk.related_system_id == system.id)
        )
        risk = existing.scalar_one_or_none()

        if risk:
            risk.corridor = corridor
            risk.delay_probability = risk_data["delay_probability"]
            risk.confidence_score = risk_data["confidence_score"]
            risk.primary_risk_factor = risk_data["primary_risk_factor"]
            risk.recommended_action = risk_data["recommended_action"]
            risk.updated_at = datetime.utcnow()
        else:
            risk = FreightRisk(
                id=str(uuid.uuid4()),
                corridor=corridor,
                related_system_id=system.id,
                updated_at=datetime.utcnow(),
                **risk_data,
            )
            db.add(risk)

        updated_risks.append(risk)

    await db.commit()
    return updated_risks
