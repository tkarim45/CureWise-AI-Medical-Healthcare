"""Emergency (nearby hospitals) routes."""

import logging

import requests
from fastapi import APIRouter, Depends, HTTPException

from src.core.dependencies import get_current_user
from src.features.emergency import service
from src.features.emergency.schemas import NearbyHospitalsResponse

router = APIRouter(prefix="/api/emergency", tags=["emergency"])
logger = logging.getLogger(__name__)


@router.get("/hospitals", response_model=NearbyHospitalsResponse)
async def nearby_hospitals(
    lat: float, lng: float, current_user: dict = Depends(get_current_user)
):
    try:
        hospitals = service.find_nearby_hospitals(lat, lng)
    except requests.RequestException as exc:
        logger.error("Overpass API error: %s", exc)
        raise HTTPException(status_code=502, detail="Hospital lookup service unavailable") from exc
    return NearbyHospitalsResponse(hospitals=hospitals)
