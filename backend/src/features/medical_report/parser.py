"""Blood-report PDF parsing (LlamaParse) and JSON structuring (OpenAI)."""

from __future__ import annotations

import json
import logging
import re

from openai import OpenAI

from src.core.config import settings

logger = logging.getLogger(__name__)

_parser = None
_client: OpenAI | None = None


def _get_parser():
    """Lazy import so a missing/skewed llama_cloud install doesn't block boot."""
    global _parser
    if _parser is None:
        from llama_cloud_services import LlamaParse

        _parser = LlamaParse(
            api_key=settings.LLAMA_PARSER_API_KEY, result_type="markdown"
        )
    return _parser


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def parse_blood_report(file_path: str) -> str:
    """Extract markdown text from a PDF blood report."""
    documents = await _get_parser().aload_data(file_path)
    if not documents or not documents[0].text:
        raise ValueError("No text extracted from PDF")
    return documents[0].text


async def structure_report(report_text: str) -> dict:
    """Turn raw report text into a structured JSON object."""
    age_match = re.search(r"Age:\s*([\d\sYMWD]+)", report_text)
    gender_match = re.search(r"Gender:\s*(Male|Female)", report_text)
    patient_age = age_match.group(1).strip() if age_match else "Unknown"
    patient_gender = gender_match.group(1).strip() if gender_match else "Unknown"

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert data parser. Parse the patient report and output "
                "only valid JSON with no additional text."
            ),
        },
        {
            "role": "user",
            "content": f"""
Parse the patient report into structured JSON with these exact keys:

1. patient_info: {{ age, gender }}
2. haematology_results: a list, each item {{ test, patient_value, unit, reference_value, remark }}
   where remark is "Normal", "Low" or "High" based on the reference range for a
   {patient_age} {patient_gender} patient.

Exclude empty entries and non-test data. Report data:

{report_text}
""",
        },
    ]
    response = _get_client().chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.1,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
