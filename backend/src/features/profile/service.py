"""Profile data-access."""

from __future__ import annotations

from src.core.database import get_conn
from src.features.profile.schemas import UserProfileUpdate

_PROFILE_COLUMNS = (
    "id, username, email, first_name, last_name, phone, "
    "profile_picture, date_of_birth, gender, address"
)
_EDITABLE_FIELDS = (
    "first_name",
    "last_name",
    "phone",
    "profile_picture",
    "date_of_birth",
    "gender",
    "address",
)


def _row_to_dict(row) -> dict:
    keys = [c.strip() for c in _PROFILE_COLUMNS.split(",")]
    profile = dict(zip(keys, row))
    if profile.get("date_of_birth") is not None:
        profile["date_of_birth"] = str(profile["date_of_birth"])
    return profile


def get_profile(user_id: str) -> dict | None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            f"SELECT {_PROFILE_COLUMNS} FROM users WHERE id = %s", (user_id,)
        )
        row = cur.fetchone()
    return _row_to_dict(row) if row else None


def update_profile(user_id: str, payload: UserProfileUpdate) -> dict | None:
    set_clause = ", ".join(f"{f} = %s" for f in _EDITABLE_FIELDS)
    values = [getattr(payload, f) for f in _EDITABLE_FIELDS] + [user_id]
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(f"UPDATE users SET {set_clause} WHERE id = %s", values)
    return get_profile(user_id)
