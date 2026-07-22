"""Disease-detection routes.

One set of endpoints serves every model via a ``{disease}`` path param resolved
against the classifier registry:

    GET  /api/disease-detection                      -> list available models
    POST /api/disease-detection/{disease}/classify   -> image -> prediction
    POST /api/disease-detection/{disease}/chat        -> specialist Q&A
"""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, Path, UploadFile

from src.core.dependencies import get_current_user
from src.features.disease_detection import service
from src.features.disease_detection.schemas import (
    ChatRequest,
    ChatResponse,
    ClassificationResponse,
    DiseaseInfo,
)
from src.features.disease_detection.specs import CLASSIFIERS, get_spec

router = APIRouter(prefix="/api/disease-detection", tags=["disease-detection"])
logger = logging.getLogger(__name__)


def _resolve(disease: str):
    spec = get_spec(disease)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Unknown disease model: {disease}")
    return spec


@router.get("", response_model=list[DiseaseInfo])
async def list_models(current_user: dict = Depends(get_current_user)):
    return [
        DiseaseInfo(
            key=s.key,
            label=s.label,
            kind=s.kind,
            labels=s.labels,
            has_chat=bool(s.system_prompt),
        )
        for s in CLASSIFIERS.values()
    ]


@router.post("/{disease}/classify", response_model=ClassificationResponse)
async def classify(
    disease: str = Path(...),
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    spec = _resolve(disease)
    if image.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG or PNG images supported.")
    try:
        image_bytes = await image.read()
        result = service.classify(spec, image_bytes)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.error("Classification failed for %s: %s", disease, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ClassificationResponse(**result)


@router.post("/{disease}/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    disease: str = Path(...),
    current_user: dict = Depends(get_current_user),
):
    spec = _resolve(disease)
    if not spec.system_prompt:
        raise HTTPException(status_code=400, detail=f"No chat for model: {disease}")
    try:
        answer = service.chat(spec, request.message)
    except Exception as exc:  # noqa: BLE001
        logger.error("Chat failed for %s: %s", disease, exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return ChatResponse(response=answer)
