"""Disease-detection orchestration: image classification + specialist chat."""

from __future__ import annotations

import logging
import re

from groq import Groq

from src.core.config import settings
from src.features.disease_detection import registry
from src.features.disease_detection.specs import ClassifierSpec

logger = logging.getLogger(__name__)

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


def classify(spec: ClassifierSpec, image_bytes: bytes) -> dict:
    if spec.kind == "segmentation":
        return registry.predict_segmentation(spec, image_bytes)
    return registry.predict_classification(spec, image_bytes)


def chat(spec: ClassifierSpec, message: str) -> str:
    full_prompt = f"{spec.system_prompt}\n\nUser query: {message}\n\nResponse:"
    completion = _get_client().chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": full_prompt}],
        stream=False,
    )
    response = completion.choices[0].message.content or ""
    response = re.sub(r"```(?:json)?\s*(.*?)\s*```", r"\1", response, flags=re.DOTALL)
    return response.strip()
