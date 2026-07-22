"""Medical-history routes."""

from fastapi import APIRouter, Depends

from src.core.dependencies import get_current_user
from src.features.medical_history import service
from src.features.medical_history.schemas import (
    MedicalHistoryCreate,
    MedicalHistoryResponse,
)

router = APIRouter(prefix="/api/medical-history", tags=["medical-history"])


@router.get("", response_model=list[MedicalHistoryResponse])
async def get_history(current_user: dict = Depends(get_current_user)):
    return service.list_history(current_user["user_id"])


@router.post("", response_model=MedicalHistoryResponse)
async def add_history(
    payload: MedicalHistoryCreate, current_user: dict = Depends(get_current_user)
):
    return service.create_history(current_user["user_id"], payload)
