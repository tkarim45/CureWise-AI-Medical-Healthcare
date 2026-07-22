from typing import Optional

from pydantic import BaseModel


class DiseaseInfo(BaseModel):
    key: str
    label: str
    kind: str
    labels: list[str]
    has_chat: bool


class ClassificationResponse(BaseModel):
    predicted_class: str
    confidence: Optional[float] = None
    images: Optional[list[str]] = None  # base64 PNGs, segmentation only


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str
