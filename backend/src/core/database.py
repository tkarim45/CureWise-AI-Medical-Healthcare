"""PostgreSQL connection pooling and helpers.

Uses a threaded connection pool so request handlers borrow a connection instead
of opening a fresh TCP/auth handshake per query (the old code opened a new
``psycopg2.connect`` in every endpoint).
"""

from __future__ import annotations

import logging
from contextlib import contextmanager

from psycopg2.pool import ThreadedConnectionPool

from src.core.config import settings

logger = logging.getLogger(__name__)

_pool: ThreadedConnectionPool | None = None


def init_pool(minconn: int = 1, maxconn: int = 10) -> None:
    global _pool
    if _pool is not None:
        return
    _pool = ThreadedConnectionPool(
        minconn,
        maxconn,
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    logger.info("Database connection pool initialized")


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None
        logger.info("Database connection pool closed")


@contextmanager
def get_conn():
    """Borrow a connection from the pool, commit on success, roll back on error."""
    if _pool is None:
        init_pool()
    conn = _pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _pool.putconn(conn)


@contextmanager
def get_cursor():
    """Borrow a connection and yield a cursor."""
    with get_conn() as conn:
        cur = conn.cursor()
        try:
            yield cur
        finally:
            cur.close()
