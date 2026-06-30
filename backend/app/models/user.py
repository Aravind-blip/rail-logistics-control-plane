import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    operator = "operator"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), nullable=False, default=UserRole.viewer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
