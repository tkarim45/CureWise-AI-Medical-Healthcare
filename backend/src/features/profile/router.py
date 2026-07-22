"""Profile routes."""

from fastapi import APIRouter, Depends, HTTPException

from src.core.dependencies import get_current_user
from src.features.profile import service
from src.features.profile.schemas import UserProfileResponse, UserProfileUpdate

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("", response_model=UserProfileResponse)
async def read_profile(current_user: dict = Depends(get_current_user)):
    profile = service.get_profile(current_user["user_id"])
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfileResponse(**profile)


@router.put("", response_model=UserProfileResponse)
async def edit_profile(
    payload: UserProfileUpdate, current_user: dict = Depends(get_current_user)
):
    profile = service.update_profile(current_user["user_id"], payload)
    if not profile:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfileResponse(**profile)
