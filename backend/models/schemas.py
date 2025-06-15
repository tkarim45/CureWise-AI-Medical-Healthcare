from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: Optional[str] = "user"  # Default to regular user


class UserInDB(BaseModel):
    id: str
    username: str
    email: str
    hashed_password: str
    role: str
    created_at: datetime


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None


class Token(BaseModel):
    token: str
    user: UserResponse


class LoginRequest(BaseModel):
    username: str
    password: str


class HospitalCreate(BaseModel):
    name: str
    address: str
    city: str
    state: str
    country: str
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    established_year: Optional[int] = None
    type: Optional[str] = None  # e.g., General, Specialty, Clinic
    bed_count: Optional[int] = None


class HospitalAdminAssign(BaseModel):
    user_id: str


class HospitalResponse(BaseModel):
    id: str
    name: str
    address: str
    city: str
    state: str
    country: str
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    established_year: Optional[int] = None
    type: Optional[str] = None  # e.g., General, Specialty, Clinic
    bed_count: Optional[int] = None
    created_at: Optional[str] = None


class HospitalAdminCreate(BaseModel):
    hospital_id: str
    username: str


class ChatbotRequest(BaseModel):
    query: str


class DepartmentCreate(BaseModel):
    name: str


class DepartmentResponse(BaseModel):
    id: str
    hospital_id: str
    name: str
    floor: Optional[str] = None
    phone: Optional[str] = None
    head_id: Optional[str] = None
    hospital_name: Optional[str] = None


class DoctorResponse(BaseModel):
    user_id: str
    department_id: str
    specialty: str
    title: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: Optional[int] = None
    education: Optional[str] = None
    username: Optional[str] = None
    email: Optional[str] = None
    department_name: Optional[str] = None
    hospital_id: Optional[str] = None  # New: included in doctor response
    hospital_name: Optional[str] = None  # New: included in doctor response


class AvailabilityCreate(BaseModel):
    user_id: str
    day_of_week: str
    start_time: str
    end_time: str


class AvailabilityResponse(BaseModel):
    id: str
    user_id: str
    day_of_week: str
    start_time: str
    end_time: str


class AppointmentCreate(BaseModel):
    doctor_id: str
    department_id: str
    hospital_id: str
    appointment_date: str
    start_time: str
    end_time: str


class AppointmentResponse(BaseModel):
    id: str
    user_id: str
    username: str
    doctor_id: str
    doctor_username: str
    department_id: str
    department_name: str
    appointment_date: str
    start_time: str
    end_time: str
    status: str
    created_at: str


class DoctorCreate(BaseModel):
    username: str
    email: str
    password: str
    department_id: str
    specialty: str
    title: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    license_number: Optional[str] = None
    years_experience: Optional[int] = None
    education: Optional[str] = None
    hospital_id: Optional[str] = None  # Only required if created by superadmin


class MedicalHistoryCreate(BaseModel):
    conditions: Optional[str] = None
    allergies: Optional[str] = None
    notes: Optional[str] = None
    updated_by: Optional[str] = None


class MedicalHistoryResponse(BaseModel):
    id: str
    user_id: str
    conditions: Optional[str]
    allergies: Optional[str]
    notes: Optional[str]
    updated_at: Optional[str]
    updated_by: Optional[str]


class TimeSlotResponse(BaseModel):
    start_time: str
    end_time: str


class AdminResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    hospital_name: Optional[str]


class AdminCreate(BaseModel):
    username: str
    email: str
    password: str
    hospital_id: Optional[str] = None


class AdminUpdate(BaseModel):
    username: Optional[str]
    email: Optional[str]
    password: Optional[str]
    hospital_id: Optional[str]


class GeneralQueryRequest(BaseModel):
    query: str


class AcneQueryRequest(BaseModel):
    query: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format string
    gender: Optional[str] = None
    address: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    profile_picture: Optional[str] = None
    date_of_birth: Optional[str] = None  # ISO format string
    gender: Optional[str] = None
    address: Optional[str] = None


class MedicalHistorySummaryRequest(BaseModel):
    user_id: str


class MedicalHistorySummaryResponse(BaseModel):
    summary: str


class EyeDiseaseChatRequest(BaseModel):
    message: str


class EyeDiseaseChatResponse(BaseModel):
    response: str
