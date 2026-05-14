"""Security utilities and dependency injection stubs."""

from fastapi import Depends, HTTPException, status
from typing import Any


def get_current_user() -> dict[str, Any]:
    """Placeholder for current user dependency.

    In a production setup this would validate a JWT or session token.
    """
    return {"user_id": "anonymous"}


def require_auth() -> None:
    """Placeholder for auth requirement.

    Raises HTTPException when auth is required but missing.
    """
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
    )
