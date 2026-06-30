from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: str
    role: UserRole = UserRole.viewer
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime


class UserUpdate(BaseModel):
    role: UserRole | None = None
    is_active: bool | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserRead


class LoginRequest(BaseModel):
    email: str
    password: str
