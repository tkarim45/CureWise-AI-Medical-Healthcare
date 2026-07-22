from typing import Optional

from pydantic import BaseModel


class MedicalHistoryCreate(BaseModel):
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None


class MedicalHistoryResponse(BaseModel):
    id: str
    user_id: str
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None
