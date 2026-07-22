"""Shared FastAPI dependencies."""

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError

from src.core.security import decode_access_token

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Resolve the authenticated user from the bearer token.

    Single-role platform: every account is a ``user``. Returns
    ``{"user_id": ..., "username": ...}``.
    """
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
    except JWTError as exc:
        logger.warning("JWT decode failed: %s", exc)
        raise credentials_error from exc

    user_id = payload.get("sub")
    if not user_id:
        raise credentials_error
    return {"user_id": user_id, "username": payload.get("username")}
