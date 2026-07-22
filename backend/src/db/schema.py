"""Database schema bootstrap.

Only the three user-facing tables survive the redesign: ``users``,
``medical_history`` and ``general_chat_history``. All hospital-management
tables (hospitals, departments, doctors, availability, appointments, admins)
are gone.
"""

import logging

from src.core.database import get_conn

logger = logging.getLogger(__name__)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    profile_picture TEXT,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_history (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conditions TEXT,
    allergies TEXT,
    notes TEXT,
    updated_at TIMESTAMP,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS general_chat_history (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    query TEXT,
    response TEXT,
    created_at TIMESTAMP
);
"""


def init_db() -> None:
    with get_conn() as conn:
        cur = conn.cursor()
        cur.execute(_SCHEMA)
        cur.close()
    logger.info("Database schema initialized")
