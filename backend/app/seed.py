"""
Seed the database with realistic freight rail mock data.
Run once on startup if tables are empty.
"""
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.system import DistributedSystem, EnvironmentType, SystemStatus
from app.models.alert import Alert, AlertSeverity, AlertStatus
from app.models.workflow import Workflow, WorkflowStatus, RiskLevel
from app.models.audit_log import AuditLog
from app.services.freight_risk_service import refresh_freight_risks

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_database(db: AsyncSession) -> None:
    # Check if already seeded
    result = await db.execute(select(User).limit(1))
    if result.scalar_one_or_none():
        return

    now = datetime.utcnow()

    # ── Users ──────────────────────────────────────────────────────────────────
    users = [
        User(
            id=str(uuid.uuid4()),
            email="admin@railops.local",
            hashed_password=pwd_context.hash("admin123"),
            role=UserRole.admin,
            is_active=True,
            created_at=now - timedelta(days=90),
        ),
        User(
            id=str(uuid.uuid4()),
            email="operator@railops.local",
            hashed_password=pwd_context.hash("operator123"),
            role=UserRole.operator,
            is_active=True,
            created_at=now - timedelta(days=60),
        ),
        User(
            id=str(uuid.uuid4()),
            email="viewer@railops.local",
            hashed_password=pwd_context.hash("viewer123"),
            role=UserRole.viewer,
            is_active=True,
            created_at=now - timedelta(days=30),
        ),
    ]
    db.add_all(users)

    # ── Distributed Systems ────────────────────────────────────────────────────
    systems_data = [
        dict(name="Dispatch API", environment=EnvironmentType.cloud, region="us-east-1",
             status=SystemStatus.healthy, latency_ms=42.3, version="3.2.1",
             owner_team="Network Operations Center", service_type="REST API (gRPC-gateway)"),
        dict(name="Freight ETA Prediction Service", environment=EnvironmentType.cloud, region="us-west-2",
             status=SystemStatus.healthy, latency_ms=118.7, version="2.0.4",
             owner_team="Applied ML Platform", service_type="ML Inference Service"),
        dict(name="Telemetry Collector", environment=EnvironmentType.cloud, region="us-central-1",
             status=SystemStatus.degraded, latency_ms=389.2, version="1.8.0",
             owner_team="Distributed Systems Engineering", service_type="Kafka Consumer / Event Ingestor"),
        dict(name="Edge Gateway - Denver Yard", environment=EnvironmentType.edge, region="denver-co",
             status=SystemStatus.healthy, latency_ms=28.1, version="1.4.2",
             owner_team="Track & Signal Engineering", service_type="Edge Gateway / Protocol Bridge"),
        dict(name="Edge Gateway - Fort Worth", environment=EnvironmentType.edge, region="fort-worth-tx",
             status=SystemStatus.degraded, latency_ms=512.0, version="1.4.1",
             owner_team="Track & Signal Engineering", service_type="Edge Gateway / Protocol Bridge"),
        dict(name="Crew Scheduling Adapter", environment=EnvironmentType.data_center, region="dc-chicago",
             status=SystemStatus.healthy, latency_ms=65.4, version="4.1.0",
             owner_team="Crew Operations Systems", service_type="Mainframe Integration Adapter (MQ)"),
        dict(name="Shipment Visibility API", environment=EnvironmentType.cloud, region="us-east-1",
             status=SystemStatus.healthy, latency_ms=55.9, version="2.3.0",
             owner_team="Shipper Experience Engineering", service_type="REST API / CDC Event Publisher"),
        dict(name="Track Sensor Stream Processor", environment=EnvironmentType.edge, region="denver-co",
             status=SystemStatus.offline, latency_ms=0.0, version="1.1.3",
             owner_team="Track & Signal Engineering", service_type="Flink Stream Processor (IoT)"),
        dict(name="Customer Notification Service", environment=EnvironmentType.cloud, region="us-west-2",
             status=SystemStatus.healthy, latency_ms=38.5, version="1.6.0",
             owner_team="Shipper Experience Engineering", service_type="Async Notification Worker"),
        dict(name="Railcar Routing Service", environment=EnvironmentType.data_center, region="dc-chicago",
             status=SystemStatus.healthy, latency_ms=72.1, version="5.0.2",
             owner_team="Network Operations Center", service_type="Constraint-Based Routing Engine"),
        dict(name="Data Center Batch Processor", environment=EnvironmentType.data_center, region="dc-kansas-city",
             status=SystemStatus.degraded, latency_ms=244.6, version="2.2.1",
             owner_team="Distributed Systems Engineering", service_type="Scheduled Batch ETL Worker"),
    ]

    system_objs = []
    for s in systems_data:
        sys = DistributedSystem(
            id=str(uuid.uuid4()),
            last_heartbeat=now - timedelta(seconds=s.get("heartbeat_age", 15)),
            **{k: v for k, v in s.items() if k != "heartbeat_age"},
        )
        system_objs.append(sys)
        db.add(sys)

    await db.flush()  # get IDs populated

    # Build name -> system lookup
    sys_map = {s.name: s for s in system_objs}

    # ── Alerts ─────────────────────────────────────────────────────────────────
    alerts_data = [
        dict(
            severity=AlertSeverity.critical,
            source_system=sys_map["Track Sensor Stream Processor"],
            title="Track Sensor Stream Processor is OFFLINE",
            description="No heartbeat received from Track Sensor Stream Processor in Denver Yard for over 15 minutes. All track occupancy data for Donner Pass segment is unavailable.",
            status=AlertStatus.open,
            created_at=now - timedelta(minutes=18),
        ),
        dict(
            severity=AlertSeverity.critical,
            source_system=sys_map["Telemetry Collector"],
            title="Telemetry ingestion latency exceeds SLO (389ms > 200ms)",
            description="Telemetry Collector p95 latency is 389ms, breaching the 200ms SLO. Downstream ETA prediction accuracy may be degraded.",
            status=AlertStatus.acknowledged,
            created_at=now - timedelta(hours=2),
            acknowledged_by="operator@railops.local",
            acknowledged_at=now - timedelta(hours=1, minutes=45),
        ),
        dict(
            severity=AlertSeverity.high,
            source_system=sys_map["Edge Gateway - Fort Worth"],
            title="Edge Gateway - Fort Worth elevated latency (512ms)",
            description="Fort Worth edge gateway reporting 512ms average latency. Manifest synchronization for Sunset Route may experience delays.",
            status=AlertStatus.open,
            created_at=now - timedelta(hours=1),
        ),
        dict(
            severity=AlertSeverity.high,
            source_system=sys_map["Data Center Batch Processor"],
            title="Batch processing job queue depth at 94% capacity",
            description="Kansas City batch processor job queue is at 94% capacity. End-of-day car location messages may not complete before 23:00 window.",
            status=AlertStatus.open,
            created_at=now - timedelta(minutes=45),
        ),
        dict(
            severity=AlertSeverity.medium,
            source_system=sys_map["Freight ETA Prediction Service"],
            title="ETA Prediction model staleness detected",
            description="The active ML model has not been refreshed with new training data for 72 hours. Predictions for mountain crossings may drift by ±18 minutes.",
            status=AlertStatus.open,
            created_at=now - timedelta(hours=3),
        ),
        dict(
            severity=AlertSeverity.medium,
            source_system=sys_map["Crew Scheduling Adapter"],
            title="SOAP upstream timeout on crew availability endpoint",
            description="Crew Scheduling Adapter received 3 consecutive timeouts from the upstream HR mainframe adapter on /getCrewAvailability. Auto-retry in progress.",
            status=AlertStatus.acknowledged,
            created_at=now - timedelta(hours=5),
            acknowledged_by="admin@railops.local",
            acknowledged_at=now - timedelta(hours=4, minutes=50),
        ),
        dict(
            severity=AlertSeverity.low,
            source_system=sys_map["Customer Notification Service"],
            title="Email delivery rate dropped to 97.2% (below 99% target)",
            description="Customer Notification Service email delivery rate is 97.2% over the last hour, below the 99% SLA target. SMS fallback is operating normally.",
            status=AlertStatus.resolved,
            created_at=now - timedelta(hours=6),
            resolved_by="operator@railops.local",
            resolved_at=now - timedelta(hours=4),
        ),
        dict(
            severity=AlertSeverity.low,
            source_system=sys_map["Dispatch API"],
            title="Dispatch API certificate expires in 14 days",
            description="TLS certificate for dispatch-api.railops.internal will expire on {expiry}. Renewal task has been created.".format(
                expiry=(now + timedelta(days=14)).strftime("%Y-%m-%d")
            ),
            status=AlertStatus.open,
            created_at=now - timedelta(days=1),
        ),
        dict(
            severity=AlertSeverity.high,
            source_system=sys_map["Railcar Routing Service"],
            title="Routing conflict detected on KC-Chicago corridor segment 7",
            description="Railcar Routing Service detected a potential routing conflict for 4 cars on segment 7 of the KC-Chicago mainline. Manual review recommended before next window.",
            status=AlertStatus.open,
            created_at=now - timedelta(minutes=10),
        ),
        dict(
            severity=AlertSeverity.medium,
            source_system=sys_map["Shipment Visibility API"],
            title="Shipment Visibility API disk usage at 78% on primary node",
            description="The primary node for Shipment Visibility API is at 78% disk utilization. Log rotation policy may be insufficient. Consider adding additional storage.",
            status=AlertStatus.resolved,
            created_at=now - timedelta(days=2),
            resolved_by="admin@railops.local",
            resolved_at=now - timedelta(days=1, hours=18),
        ),
    ]

    for a in alerts_data:
        src = a.pop("source_system")
        alert = Alert(
            id=str(uuid.uuid4()),
            source_system_id=src.id,
            **a,
        )
        db.add(alert)

    # ── Workflows ──────────────────────────────────────────────────────────────
    workflows_data = [
        dict(
            workflow_type="emergency_maintenance_window",
            requester="operator@railops.local",
            approver="admin@railops.local",
            risk_level=RiskLevel.high,
            status=WorkflowStatus.approved,
            description="Emergency maintenance window for Track Sensor Stream Processor in Denver Yard. Requires brief outage during 02:00-04:00 MT window.",
            created_at=now - timedelta(hours=3),
            updated_at=now - timedelta(hours=2),
            audit_trail=[
                {"event": "created", "actor": "operator@railops.local", "timestamp": (now - timedelta(hours=3)).isoformat()},
                {"event": "approved", "actor": "admin@railops.local", "timestamp": (now - timedelta(hours=2)).isoformat()},
            ],
        ),
        dict(
            workflow_type="hotfix_deployment",
            requester="operator@railops.local",
            approver=None,
            risk_level=RiskLevel.medium,
            status=WorkflowStatus.requested,
            description="Deploy Telemetry Collector v1.9.0 patch to address latency regression introduced in v1.8.0.",
            created_at=now - timedelta(hours=1),
            updated_at=now - timedelta(hours=1),
            audit_trail=[
                {"event": "created", "actor": "operator@railops.local", "timestamp": (now - timedelta(hours=1)).isoformat()},
            ],
        ),
        dict(
            workflow_type="horizontal_scaling_event",
            requester="admin@railops.local",
            approver="admin@railops.local",
            risk_level=RiskLevel.low,
            status=WorkflowStatus.completed,
            description="Scale Data Center Batch Processor queue workers from 4 to 8 to handle end-of-quarter car location message volume.",
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=2),
            audit_trail=[
                {"event": "created", "actor": "admin@railops.local", "timestamp": (now - timedelta(days=3)).isoformat()},
                {"event": "approved", "actor": "admin@railops.local", "timestamp": (now - timedelta(days=3, hours=-1)).isoformat()},
                {"event": "completed", "actor": "admin@railops.local", "timestamp": (now - timedelta(days=2)).isoformat()},
            ],
        ),
        dict(
            workflow_type="tls_certificate_rotation",
            requester="operator@railops.local",
            approver=None,
            risk_level=RiskLevel.low,
            status=WorkflowStatus.requested,
            description="Renew TLS certificate for dispatch-api.railops.internal before expiry. Zero-downtime rotation via cert-manager.",
            created_at=now - timedelta(hours=20),
            updated_at=now - timedelta(hours=20),
            audit_trail=[
                {"event": "created", "actor": "operator@railops.local", "timestamp": (now - timedelta(hours=20)).isoformat()},
            ],
        ),
        dict(
            workflow_type="ml_model_promotion",
            requester="operator@railops.local",
            approver=None,
            risk_level=RiskLevel.medium,
            status=WorkflowStatus.rejected,
            description="Refresh Freight ETA Prediction ML model with last 7-day actuals to correct mountain crossing drift.",
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(hours=18),
            audit_trail=[
                {"event": "created", "actor": "operator@railops.local", "timestamp": (now - timedelta(days=1)).isoformat()},
                {"event": "rejected", "actor": "admin@railops.local", "reason": "Insufficient validation data — resubmit after 48hr data backfill completes.", "timestamp": (now - timedelta(hours=18)).isoformat()},
            ],
        ),
        dict(
            workflow_type="routing_table_update",
            requester="admin@railops.local",
            approver="admin@railops.local",
            risk_level=RiskLevel.high,
            status=WorkflowStatus.approved,
            description="Update Edge Gateway Fort Worth routing table to add backup path through Dallas intermodal. Required due to degraded primary link.",
            created_at=now - timedelta(minutes=30),
            updated_at=now - timedelta(minutes=15),
            audit_trail=[
                {"event": "created", "actor": "admin@railops.local", "timestamp": (now - timedelta(minutes=30)).isoformat()},
                {"event": "approved", "actor": "admin@railops.local", "timestamp": (now - timedelta(minutes=15)).isoformat()},
            ],
        ),
    ]

    for w in workflows_data:
        workflow = Workflow(id=str(uuid.uuid4()), **w)
        db.add(workflow)

    # ── Audit Logs (bootstrap) ─────────────────────────────────────────────────
    bootstrap_audits = [
        AuditLog(
            id=str(uuid.uuid4()),
            actor="admin@railops.local",
            action="login",
            resource_type="user",
            resource_id=users[0].id,
            timestamp=now - timedelta(hours=8),
            metadata_={"role": "admin"},
        ),
        AuditLog(
            id=str(uuid.uuid4()),
            actor="operator@railops.local",
            action="login",
            resource_type="user",
            resource_id=users[1].id,
            timestamp=now - timedelta(hours=6),
            metadata_={"role": "operator"},
        ),
    ]
    db.add_all(bootstrap_audits)

    await db.commit()

    # Run freight risk engine after committing systems
    await refresh_freight_risks(db)
