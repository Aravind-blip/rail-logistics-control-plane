import uuid
import structlog
from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext

from app.database import get_db
from app.models.user import User
from app.models.audit_log import AuditLog
from app.schemas.user import LoginRequest, TokenResponse, UserRead
from app.auth.jwt import create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = structlog.get_logger(__name__)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user or not pwd_context.verify(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    token = create_access_token(
        {"sub": user.id, "email": user.email, "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    audit = AuditLog(
        id=str(uuid.uuid4()),
        actor=user.email,
        action="login",
        resource_type="user",
        resource_id=user.id,
        timestamp=datetime.utcnow(),
        metadata_={"role": user.role.value},
    )
    db.add(audit)
    await db.commit()

    logger.info("user_login", email=user.email, role=user.role.value)

    return TokenResponse(
        access_token=token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserRead.model_validate(current_user)
