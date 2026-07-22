"""Auth data-access and business logic."""

import uuid
from datetime import datetime, timezone

from psycopg2 import IntegrityError

from src.auth.schemas import UserCreate
from src.core.database import get_conn
from src.core.security import hash_password, verify_password


class AuthError(Exception):
    """Raised for expected auth failures (duplicate user, bad credentials)."""


def create_user(user: UserCreate) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT 1 FROM users WHERE username = %s OR email = %s",
            (user.username, user.email),
        )
        if cur.fetchone():
            raise AuthError("Username or email already exists")

        user_id = str(uuid.uuid4())
        try:
            cur.execute(
                """
                INSERT INTO users (id, username, email, password, created_at)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    user.username,
                    user.email,
                    hash_password(user.password),
                    datetime.now(timezone.utc),
                ),
            )
        except IntegrityError as exc:
            raise AuthError("Error creating user") from exc

    return {"id": user_id, "username": user.username, "email": user.email}


def authenticate(username: str, password: str) -> dict:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, username, email, password FROM users WHERE username = %s",
            (username,),
        )
        row = cur.fetchone()

    if not row or not verify_password(password, row[3]):
        raise AuthError("Incorrect username or password")
    return {"id": row[0], "username": row[1], "email": row[2]}
