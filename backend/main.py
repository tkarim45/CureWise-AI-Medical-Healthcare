import logging
from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    BackgroundTasks,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
import psycopg2
from models.schemas import *
import uuid
from datetime import datetime
from typing import Optional, List
from config.settings import settings
from utils.db import init_db, initialize_users
from utils.parser import *
from routes.auth import *
from routes import auth
from routes.hospital import router as hospital_router
from routes.doctor import router as doctor_router
from routes.ai import router as ai_router
from utils.pineconeutils import *
from utils.email import *
from utils.agents import *
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

init_db()


@asynccontextmanager
async def lifespan(app):
    await initialize_users()
    yield


app = FastAPI(lifespan=lifespan)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.ngrok-free.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hospital_router)
app.include_router(doctor_router)
app.include_router(ai_router)


@app.get("/api/admin/hospital", response_model=HospitalResponse)
async def get_admin_hospital(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    logger.info(f"Current user: {current_user}")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        "SELECT h.id, h.name, h.address, h.city, h.state, h.country, h.postal_code, h.phone, h.email, h.website, h.established_year, h.type, h.bed_count, h.created_at FROM hospitals h JOIN hospital_admins ha ON h.id = ha.hospital_id WHERE ha.user_id = %s",
        (current_user["user_id"],),
    )
    hospital = c.fetchone()
    conn.close()

    if not hospital:
        raise HTTPException(status_code=404, detail="No hospital assigned")

    return HospitalResponse(
        id=hospital[0],
        name=hospital[1],
        address=hospital[2],
        city=hospital[3],
        state=hospital[4],
        country=hospital[5],
        postal_code=hospital[6],
        phone=hospital[7],
        email=hospital[8],
        website=hospital[9],
        established_year=hospital[10],
        type=hospital[11],
        bed_count=hospital[12],
        created_at=str(hospital[13]) if hospital[13] else None,
    )


@app.post("/api/departments", response_model=DepartmentResponse)
async def create_department(
    department: DepartmentCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    c.execute(
        "SELECT hospital_id FROM hospital_admins WHERE user_id = %s",
        (current_user["user_id"],),
    )
    hospital_id = c.fetchone()
    if not hospital_id:
        conn.close()
        raise HTTPException(status_code=404, detail="No hospital assigned")
    hospital_id = hospital_id[0]

    department_id = str(uuid.uuid4())
    c.execute(
        "INSERT INTO departments (id, hospital_id, name) VALUES (%s, %s, %s)",
        (department_id, hospital_id, department.name),
    )

    conn.commit()
    conn.close()

    logger.info(f"Department created: {department.name} in hospital {hospital_id}")
    return DepartmentResponse(
        id=department_id, hospital_id=hospital_id, name=department.name
    )


@app.get("/api/departments", response_model=List[DepartmentResponse])
async def get_departments(
    hospital_id: Optional[str] = None, current_user: dict = Depends(get_current_user)
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    query = """
        SELECT d.id, d.hospital_id, d.name, h.name
        FROM departments d
        JOIN hospitals h ON d.hospital_id = h.id
    """
    params = []
    if hospital_id:
        query += " WHERE d.hospital_id = %s"
        params.append(hospital_id)
    c.execute(query, params)
    departments = [
        DepartmentResponse(
            id=row[0], hospital_id=row[1], name=row[2], hospital_name=row[3]
        )
        for row in c.fetchall()
    ]
    conn.close()
    logger.info(
        f"Fetched departments for user {current_user['user_id']}, hospital_id: {hospital_id}"
    )
    return departments


@app.post("/api/appointments", response_model=AppointmentResponse)
async def book_appointment(
    appointment: AppointmentCreate,
    current_user: dict = Depends(get_current_user),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if current_user["role"] not in ["user", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    # Verify doctor exists and get username
    c.execute(
        """
        SELECT u.id, u.username
        FROM users u
        WHERE u.id = %s AND u.role = 'doctor'
        """,
        (appointment.doctor_id,),
    )
    doctor = c.fetchone()
    if not doctor:
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")
    doctor_id, doctor_username = doctor

    # Verify department exists and get name
    c.execute(
        """
        SELECT d.id, d.name
        FROM departments d
        WHERE d.id = %s
        """,
        (appointment.department_id,),
    )
    department = c.fetchone()
    if not department:
        conn.close()
        raise HTTPException(status_code=404, detail="Department not found")
    department_id, department_name = department

    # Verify hospital exists
    c.execute("SELECT id FROM hospitals WHERE id = %s", (appointment.hospital_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Hospital not found")

    # Verify slot is available
    c.execute(
        """
        SELECT id FROM doctor_availability
        WHERE user_id = %s AND day_of_week = %s AND start_time = %s AND end_time = %s
        """,
        (
            appointment.doctor_id,
            datetime.strptime(appointment.appointment_date, "%Y-%m-%d").strftime("%A"),
            appointment.start_time,
            appointment.end_time,
        ),
    )
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Slot not available")

    # Check if slot is already booked
    c.execute(
        """
        SELECT id FROM appointments
        WHERE doctor_id = %s AND appointment_date = %s AND start_time = %s AND status != 'cancelled'
        """,
        (appointment.doctor_id, appointment.appointment_date, appointment.start_time),
    )
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Slot already booked")

    # Fetch patient's username and email
    c.execute(
        "SELECT username, email FROM users WHERE id = %s",
        (current_user["user_id"],),
    )
    user = c.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    patient_username, patient_email = user

    # Insert appointment
    appointment_id = str(uuid.uuid4())
    created_at = datetime.utcnow()
    c.execute(
        """
        INSERT INTO appointments (
            id, user_id, doctor_id, department_id, hospital_id, appointment_date, 
            start_time, end_time, status, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            appointment_id,
            current_user["user_id"],
            appointment.doctor_id,
            appointment.department_id,
            appointment.hospital_id,
            appointment.appointment_date,
            appointment.start_time,
            appointment.end_time,
            "scheduled",
            created_at,
        ),
    )

    conn.commit()
    conn.close()

    # Send confirmation email in the background
    if patient_email:
        background_tasks.add_task(
            send_confirmation_email,
            recipient_email=patient_email,
            patient_username=patient_username,
            doctor_username=doctor_username,
            department_name=department_name,
            appointment_date=appointment.appointment_date,
            start_time=appointment.start_time,
            hospital_id=appointment.hospital_id,
        )

    logger.info(
        f"Booked appointment for user {current_user['user_id']} with doctor {appointment.doctor_id}"
    )
    return AppointmentResponse(
        id=appointment_id,
        user_id=current_user["user_id"],
        username=patient_username,
        doctor_id=appointment.doctor_id,
        doctor_username=doctor_username,
        department_id=appointment.department_id,
        department_name=department_name,
        appointment_date=appointment.appointment_date,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        status="scheduled",
        created_at=str(created_at),
        hospital_id=appointment.hospital_id,
    )


@app.get("/api/appointments", response_model=List[AppointmentResponse])
async def get_appointments(current_user: dict = Depends(get_current_user)):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    if current_user["role"] == "admin":
        c.execute(
            """
            SELECT a.id, a.user_id, a.doctor_id, a.department_id, a.appointment_date, a.start_time, a.end_time, a.status, a.created_at
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.user_id
            JOIN departments dept ON d.department_id = dept.id
            JOIN hospital_admins ha ON dept.hospital_id = ha.hospital_id
            WHERE ha.user_id = %s
            """,
            (current_user["user_id"],),
        )
    else:
        c.execute(
            """
            SELECT id, user_id, doctor_id, department_id, appointment_date, start_time, end_time, status, created_at
            FROM appointments
            WHERE user_id = %s
            """,
            (current_user["user_id"],),
        )
    appointments = [
        AppointmentResponse(
            id=row[0],
            user_id=row[1],
            doctor_id=row[2],
            department_id=row[3],
            appointment_date=row[4],
            start_time=row[5],
            end_time=row[6],
            status=row[7],
            created_at=str(row[8]),
        )
        for row in c.fetchall()
    ]
    conn.close()

    logger.info(f"Fetched appointments for user {current_user['user_id']}")
    return appointments


@app.get("/api/admins", response_model=List[AdminResponse])
async def get_admins(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        """
        SELECT u.id, u.username, u.email, u.role, h.name
        FROM users u
        LEFT JOIN hospital_admins ha ON u.id = ha.user_id
        LEFT JOIN hospitals h ON ha.hospital_id = h.id
        WHERE u.role = 'admin'
        """
    )
    admins = [
        AdminResponse(
            id=row[0], username=row[1], email=row[2], role=row[3], hospital_name=row[4]
        )
        for row in c.fetchall()
    ]
    conn.close()

    logger.info(f"Fetched admins for superadmin {current_user['user_id']}")
    return admins


@app.get("/api/appointments", response_model=List[AppointmentResponse])
async def get_all_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        """
        SELECT a.id, a.user_id, u.username, a.doctor_id, du.username, a.department_id,
               d.name, a.appointment_date, a.start_time, a.end_time, a.status, a.created_at
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN users du ON a.doctor_id = du.id
        JOIN departments d ON a.department_id = d.id
        WHERE a.status != 'cancelled'
        ORDER BY a.appointment_date, a.start_time
        """
    )
    appointments = [
        AppointmentResponse(
            id=row[0],
            user_id=row[1],
            username=row[2],
            doctor_id=row[3],
            doctor_username=row[4],
            department_id=row[5],
            department_name=row[6],
            appointment_date=row[7],
            start_time=row[8],
            end_time=row[9],
            status=row[10],
            created_at=str(row[11]),
        )
        for row in c.fetchall()
    ]
    conn.close()

    logger.info(f"Fetched all appointments for superadmin {current_user['user_id']}")
    return appointments


@app.get("/api/medical-history", response_model=List[MedicalHistoryResponse])
async def get_medical_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        """
        SELECT id, user_id, conditions, allergies, notes, updated_at, updated_by
        FROM medical_history
        WHERE user_id = %s
        """,
        (user_id,),
    )
    records = [
        MedicalHistoryResponse(
            id=row[0],
            user_id=row[1],
            conditions=row[2],
            allergies=row[3],
            notes=row[4],
            updated_at=str(row[5]),
            updated_by=row[6],
        )
        for row in c.fetchall()
    ]
    conn.close()
    return records


@app.post("/api/medical-history", response_model=MedicalHistoryResponse)
async def create_medical_history(
    medical_history: MedicalHistoryCreate,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid user data")

    record_id = str(uuid.uuid4())
    updated_at = datetime.utcnow()

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        """
        INSERT INTO medical_history (id, user_id, conditions, allergies, notes, updated_at, updated_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        (
            record_id,
            user_id,
            medical_history.conditions,
            medical_history.allergies,
            medical_history.notes,
            updated_at,
            user_id,
        ),
    )
    conn.commit()
    conn.close()

    logger.info(f"Created medical history record {record_id} for user {user_id}")
    return MedicalHistoryResponse(
        id=record_id,
        user_id=user_id,
        conditions=medical_history.conditions,
        allergies=medical_history.allergies,
        notes=medical_history.notes,
        updated_at=str(updated_at),
        updated_by=user_id,
    )


@app.get("/api/profile", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Fetch the current user's profile data."""
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute(
        """
        SELECT id, username, email, role, first_name, last_name, phone, profile_picture, date_of_birth, gender, address
        FROM users WHERE id = %s
        """,
        (current_user["user_id"],),
    )
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfileResponse(
        id=row[0],
        username=row[1],
        email=row[2],
        role=row[3],
        first_name=row[4],
        last_name=row[5],
        phone=row[6],
        profile_picture=row[7],
        date_of_birth=row[8],
        gender=row[9],
        address=row[10],
    )


@app.put("/api/profile", response_model=UserProfileResponse)
async def update_profile(
    profile: UserProfileUpdate, current_user: dict = Depends(get_current_user)
):
    """Update the current user's profile data."""
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    # Only allow updating certain fields
    update_fields = [
        "first_name",
        "last_name",
        "phone",
        "profile_picture",
        "date_of_birth",
        "gender",
        "address",
    ]
    set_clause = ", ".join([f"{field} = %s" for field in update_fields])
    values = [
        profile.first_name,
        profile.last_name,
        profile.phone,
        profile.profile_picture,
        profile.date_of_birth,
        profile.gender,
        profile.address,
        current_user["user_id"],
    ]
    try:
        c.execute(
            f"UPDATE users SET {set_clause} WHERE id = %s",
            values,
        )
        conn.commit()
    except psycopg2.IntegrityError as e:
        conn.rollback()
        conn.close()
        raise HTTPException(status_code=400, detail="Profile update failed")
    # Return updated profile
    c.execute(
        """
        SELECT id, username, email, role, first_name, last_name, phone, profile_picture, date_of_birth, gender, address
        FROM users WHERE id = %s
        """,
        (current_user["user_id"],),
    )
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found after update")
    return UserProfileResponse(
        id=row[0],
        username=row[1],
        email=row[2],
        role=row[3],
        first_name=row[4],
        last_name=row[5],
        phone=row[6],
        profile_picture=row[7],
        date_of_birth=row[8],
        gender=row[9],
        address=row[10],
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
