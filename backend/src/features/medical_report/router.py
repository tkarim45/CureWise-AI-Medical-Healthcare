"""Blood-report analysis routes."""

from __future__ import annotations

import logging
import os
import tempfile
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from src.core.dependencies import get_current_user
from src.features.medical_report import service
from src.features.medical_report.schemas import MedicalReportResponse

router = APIRouter(prefix="/api/medical-report", tags=["medical-report"])
logger = logging.getLogger(__name__)


@router.post("/query", response_model=MedicalReportResponse)
async def query(
    query: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if not file and not (query and query.strip()):
        raise HTTPException(
            status_code=400,
            detail="Provide a question or upload a blood report PDF.",
        )

    tmp_path: str | None = None
    try:
        if file:
            suffix = os.path.splitext(file.filename or "")[1] or ".pdf"
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            with os.fdopen(fd, "wb") as f:
                f.write(await file.read())
        result = await service.analyze(current_user["user_id"], query, tmp_path)
        return MedicalReportResponse(**result)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.error("Medical report query failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
