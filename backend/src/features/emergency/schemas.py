from pydantic import BaseModel


class NearbyHospital(BaseModel):
    name: str
    address: str
    lat: float
    lng: float


class NearbyHospitalsResponse(BaseModel):
    hospitals: list[NearbyHospital]
