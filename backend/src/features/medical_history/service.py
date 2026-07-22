"""Medical-history data-access."""

import uuid
from datetime import datetime, timezone

from src.core.database import get_conn
from src.features.medical_history.schemas import MedicalHistoryCreate


def list_history(user_id: str) -> list[dict]:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, user_id, conditions, allergies, notes, updated_at, updated_by
            FROM medical_history WHERE user_id = %s ORDER BY updated_at DESC
            """,
            (user_id,),
        )
        rows = cur.fetchall()
    return [
        {
            "id": str(r[0]),
            "user_id": str(r[1]),
            "conditions": r[2],
            "allergies": r[3],
            "notes": r[4],
            "updated_at": str(r[5]) if r[5] else None,
            "updated_by": str(r[6]) if r[6] else None,
        }
        for r in rows
    ]


def create_history(user_id: str, payload: MedicalHistoryCreate) -> dict:
    record_id = str(uuid.uuid4())
    updated_at = datetime.now(timezone.utc)
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO medical_history
                (id, user_id, conditions, allergies, notes, updated_at, updated_by)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                record_id,
                user_id,
                payload.conditions,
                payload.allergies,
                payload.notes,
                updated_at,
                user_id,
            ),
        )
    return {
        "id": record_id,
        "user_id": user_id,
        "conditions": payload.conditions,
        "allergies": payload.allergies,
        "notes": payload.notes,
        "updated_at": str(updated_at),
        "updated_by": user_id,
    }
