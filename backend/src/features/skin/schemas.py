from pydantic import BaseModel


class AcneAnalysisResponse(BaseModel):
    response: str
