"""General medical chatbot routes (RAG)."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from src.core.dependencies import get_current_user
from src.features.chat import service
from src.features.chat.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="A non-empty query is required")
    try:
        answer = service.chat(request.query, current_user["user_id"])
    except Exception as exc:  # noqa: BLE001
        logger.error("Chat failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ChatResponse(response=answer)
