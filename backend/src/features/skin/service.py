"""Acne / skin image analysis using Groq's vision model."""

from __future__ import annotations

import logging

from groq import Groq

from src.core.config import settings

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """
You are a friendly dermatology AI assistant analyzing skin images for acne.
Follow these rules:
1. Describe the acne: type (pimples, blackheads...), severity (mild/moderate/severe), location.
2. Use clear, non-technical language.
3. Keep it 80-120 words.
4. Suggest 1-2 next steps (e.g. gentle cleanser, see a dermatologist).
5. Flag when to see a doctor (painful or spreading).
6. Note this is not a medical diagnosis.
7. Output plain text only.
"""

_client: Groq | None = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


async def analyze_acne(image_url: str) -> str:
    completion = _get_client().chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.7,
        max_tokens=250,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this image for acne."},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            },
        ],
    )
    return completion.choices[0].message.content or ""
