"""Blood-report analysis service.

Keeps a short in-memory, per-user context of the last parsed report so a user
can ask follow-up questions ("what should I do next?") without re-uploading.
"""

from __future__ import annotations

import json
import logging
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from openai import OpenAI

from src.core.config import settings
from src.features.medical_report import parser

logger = logging.getLogger(__name__)

_HISTORY_LIMIT = 5
_HISTORY_TIMEOUT = timedelta(hours=1)
# {user_id: [{"report_json": dict|None, "timestamp": datetime}, ...]}
_history: dict[str, list[dict]] = defaultdict(list)

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def _prune(user_id: str) -> None:
    now = datetime.now(timezone.utc)
    _history[user_id] = [
        e for e in _history[user_id] if now - e["timestamp"] < _HISTORY_TIMEOUT
    ][-_HISTORY_LIMIT:]


def _remember(user_id: str, report_json: dict | None) -> None:
    _prune(user_id)
    _history[user_id].append(
        {"report_json": report_json, "timestamp": datetime.now(timezone.utc)}
    )


def _last_report(user_id: str) -> dict | None:
    _prune(user_id)
    for entry in reversed(_history[user_id]):
        if entry["report_json"]:
            return entry["report_json"]
    return None


def _clean(text: str) -> str:
    text = text.strip()
    text = re.sub(r"```(?:json)?\s*(.*?)\s*```", r"\1", text, flags=re.DOTALL)
    return text.strip()


def _build_prompt(query: str, report_json: dict | None) -> str:
    prompt = f"""
Analyze the blood test results and answer the question using these rules:
1. Keep answers concise (100-150 words) and easy to understand.
2. Use simple analogies to explain medical concepts.
3. For abnormal values, explain meaning, possible causes and reasonable next steps.
4. Indicate urgency (routine / moderate / immediate attention) for concerning values.
5. Always note this is informational, not a diagnosis.
6. Structure: Summary of findings, Explanation of key values, Recommendations.

Current Query: {query}
"""
    if report_json:
        info = report_json.get("patient_info", {})
        prompt += f"""
Patient Age: {info.get('age', 'Unknown')}
Patient Gender: {info.get('gender', 'Unknown')}
Blood Test Results (JSON):
{json.dumps(report_json, indent=2)}
"""
    else:
        prompt += "\nNo blood test results available."
    return prompt


async def analyze(user_id: str, query: str | None, file_path: str | None) -> dict:
    report_json: dict | None = None

    if file_path:
        report_text = await parser.parse_blood_report(file_path)
        try:
            report_json = await parser.structure_report(report_text)
            if not isinstance(report_json, dict):
                report_json = None
        except Exception as exc:  # noqa: BLE001
            logger.error("structure_report failed: %s", exc)
            report_json = None
        effective_query = query.strip() if query else "Explain my blood test results"
    else:
        report_json = _last_report(user_id)
        effective_query = (query or "").strip()

    prompt = _build_prompt(effective_query, report_json)
    completion = _get_client().chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert medical professional who explains blood test "
                    "results in simple terms."
                ),
            },
            {"role": "user", "content": prompt},
        ],
    )
    response = _clean(completion.choices[0].message.content or "")
    if not response:
        raise ValueError("Empty response from model")

    _remember(user_id, report_json)
    return {"structured_report": report_json, "response": response}
