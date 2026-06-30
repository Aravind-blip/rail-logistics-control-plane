from fastapi import Depends, HTTPException, status
from app.auth.jwt import get_current_user
from app.models.user import User, UserRole


def require_role(*roles: UserRole):
    """Dependency factory that enforces one of the given roles."""

    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role(s): {[r.value for r in roles]}",
            )
        return current_user

    return _check


def require_admin():
    return require_role(UserRole.admin)


def require_operator_or_admin():
    return require_role(UserRole.operator, UserRole.admin)


def require_any_role():
    return require_role(UserRole.admin, UserRole.operator, UserRole.viewer)
