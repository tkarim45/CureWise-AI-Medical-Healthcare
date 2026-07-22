"""Chat service: persist history in Postgres and answer via RAG."""

import logging
import uuid
from datetime import datetime, timezone

from src.core.database import get_conn
from src.features.chat import rag

logger = logging.getLogger(__name__)


def _store(user_id: str, query: str, response: str) -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO general_chat_history (id, user_id, query, response, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (str(uuid.uuid4()), user_id, query, response, datetime.now(timezone.utc)),
        )


def _recent_history(user_id: str, limit: int = 2) -> str:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT query, response FROM general_chat_history
            WHERE user_id = %s ORDER BY created_at DESC LIMIT %s
            """,
            (user_id, limit),
        )
        rows = cur.fetchall()
    return "".join(f"User: {q}\nAssistant: {r}\n\n" for q, r in reversed(rows))


def chat(query: str, user_id: str) -> str:
    history_text = _recent_history(user_id)
    answer = rag.answer(query, history_text)
    _store(user_id, query, answer)
    return answer
