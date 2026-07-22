"""CureWise AI — FastAPI application factory.

User-facing medical AI platform. Every route sits behind a single ``user`` role
(no doctor/admin/superadmin). Feature routers live under ``src/features/*`` and
are mounted here.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.auth.router import router as auth_router
from src.core.config import settings
from src.core.database import close_pool, init_pool
from src.core.logging import setup_logging
from src.db.schema import init_db
from src.features.chat.router import router as chat_router
from src.features.disease_detection.router import router as disease_router
from src.features.emergency.router import router as emergency_router
from src.features.medical_history.router import router as medical_history_router
from src.features.medical_report.router import router as medical_report_router
from src.features.profile.router import router as profile_router
from src.features.skin.router import router as skin_router

setup_logging()
logger = logging.getLogger(__name__)

ROUTERS = (
    auth_router,
    profile_router,
    medical_history_router,
    chat_router,
    medical_report_router,
    skin_router,
    emergency_router,
    disease_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # DB init is best-effort at startup so the app still boots for inspection
    # when Postgres isn't reachable yet; endpoints retry on first use.
    try:
        init_pool()
        init_db()
    except Exception as exc:  # noqa: BLE001
        logger.warning("DB init deferred (will retry on first query): %s", exc)
    # Warm the RAG chain, but don't block startup if the vector store is down.
    try:
        from src.features.chat.rag import init_rag

        init_rag()
    except Exception as exc:  # noqa: BLE001
        logger.warning("RAG init deferred (will retry on first query): %s", exc)
    yield
    close_pool()


def create_app() -> FastAPI:
    app = FastAPI(title="CureWise AI", version="2.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for r in ROUTERS:
        app.include_router(r)

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "service": "curewise-ai"}

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
