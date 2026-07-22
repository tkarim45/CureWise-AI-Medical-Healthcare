from typing import Any, Optional

from pydantic import BaseModel


class MedicalReportResponse(BaseModel):
    structured_report: Optional[dict[str, Any]] = None
    response: str
