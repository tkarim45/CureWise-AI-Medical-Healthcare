from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import psycopg2
from datetime import date, datetime, timedelta
import logging
from config.settings import settings
from models.schemas import (
    DepartmentResponse,
    AppointmentResponse,
    MedicalHistoryResponse,
    DoctorCreate,
    DoctorResponse,
    TimeSlotResponse,
)
from routes.auth import get_current_user
import uuid
from passlib.context import CryptContext

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()


@router.get("/api/doctor/department", response_model=DepartmentResponse)
async def get_doctor_department(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
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
        SELECT d.id, d.hospital_id, d.name, h.name, d.floor, d.phone, d.head_id
        FROM departments d
        JOIN doctors doc ON d.id = doc.department_id
        JOIN hospitals h ON d.hospital_id = h.id
        WHERE doc.user_id = %s
        """,
        (current_user["user_id"],),
    )
    department = c.fetchone()
    conn.close()

    if not department:
        raise HTTPException(status_code=404, detail="No department assigned")

    logger.info(f"Fetched department for doctor {current_user['user_id']}")
    return DepartmentResponse(
        id=department[0],
        hospital_id=department[1],
        name=department[2],
        hospital_name=department[3],
        floor=department[4],
        phone=department[5],
        head_id=department[6],
    )


@router.get("/api/doctor/appointments/today", response_model=List[AppointmentResponse])
async def get_todays_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    today = date.today().isoformat()
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
        SELECT a.id, a.user_id, u.username, u.email, a.doctor_id, du.username, a.department_id,
               d.name, a.appointment_date, a.start_time, a.end_time, a.status, a.created_at,
               a.hospital_id
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN users du ON a.doctor_id = du.id
        JOIN departments d ON a.department_id = d.id
        WHERE a.doctor_id = %s AND a.appointment_date = %s AND a.status != 'cancelled'
        ORDER BY a.start_time
        """,
        (current_user["user_id"], today),
    )
    appointments = [
        AppointmentResponse(
            id=row[0],
            user_id=row[1],
            username=row[2],
            email=row[3],
            doctor_id=row[4],
            doctor_username=row[5],
            department_id=row[6],
            department_name=row[7],
            appointment_date=row[8],
            start_time=row[9],
            end_time=row[10],
            status=row[11],
            created_at=str(row[12]),
            hospital_id=row[13],
        )
        for row in c.fetchall()
    ]
    conn.close()

    logger.info(f"Fetched today's appointments for doctor {current_user['user_id']}")
    return appointments


@router.get("/api/doctor/appointments/week", response_model=List[AppointmentResponse])
async def get_weekly_appointments(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Calculate the start (Monday) and end (Sunday) of the current week
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())  # Monday
    end_of_week = start_of_week + timedelta(days=6)  # Sunday
    start_date = start_of_week.isoformat()
    end_date = end_of_week.isoformat()

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
        SELECT a.id, a.user_id, u.username, u.email, a.doctor_id, du.username, a.department_id,
               d.name, a.appointment_date, a.start_time, a.end_time, a.status, a.created_at,
               a.hospital_id
        FROM appointments a
        JOIN users u ON a.user_id = u.id
        JOIN users du ON a.doctor_id = du.id
        JOIN departments d ON a.department_id = d.id
        WHERE a.doctor_id = %s 
        AND a.appointment_date BETWEEN %s AND %s 
        AND a.status != 'cancelled'
        ORDER BY a.appointment_date, a.start_time
        """,
        (current_user["user_id"], start_date, end_date),
    )
    appointments = [
        AppointmentResponse(
            id=row[0],
            user_id=row[1],
            username=row[2],
            email=row[3],
            doctor_id=row[4],
            doctor_username=row[5],
            department_id=row[6],
            department_name=row[7],
            appointment_date=row[8],
            start_time=row[9],
            end_time=row[10],
            status=row[11],
            created_at=str(row[12]),
            hospital_id=row[13],
        )
        for row in c.fetchall()
    ]
    conn.close()

    logger.info(
        f"Fetched weekly appointments for doctor {current_user['user_id']} from {start_date} to {end_date}"
    )
    return appointments


@router.get(
    "/api/doctor/patient/{user_id}/history", response_model=List[MedicalHistoryResponse]
)
async def get_patient_medical_history(
    user_id: str, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Verify doctor has an appointment with this patient
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
        SELECT id FROM appointments
        WHERE doctor_id = %s AND user_id = %s AND status != 'cancelled'
        """,
        (current_user["user_id"], user_id),
    )
    if not c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=403, detail="No active appointments with this patient"
        )

    c.execute(
        """
        SELECT id, user_id, conditions, allergies, notes, updated_at, updated_by
        FROM medical_history
        WHERE user_id = %s
        ORDER BY updated_at DESC
        """,
        (user_id,),
    )
    history = [
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

    logger.info(
        f"Fetched medical history for patient {user_id} by doctor {current_user['user_id']}"
    )
    return history


@router.post("/api/doctors", response_model=dict)
async def assign_doctor(
    doctor: DoctorCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] == "admin":
        # Get admin's hospital
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
            logger.error("No hospital assigned to admin")
            raise HTTPException(status_code=404, detail="No hospital assigned")
        hospital_id = hospital_id[0]
        logger.info(f"Admin hospital_id: {hospital_id}")
    elif current_user["role"] == "superadmin":
        if not doctor.hospital_id:
            raise HTTPException(
                status_code=400,
                detail="hospital_id is required for superadmin doctor creation",
            )
        hospital_id = doctor.hospital_id
        conn = psycopg2.connect(
            dbname=settings.DB_NAME,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
        )
        c = conn.cursor()
    else:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Verify department belongs to the hospital
    c.execute(
        "SELECT id FROM departments WHERE id = %s AND hospital_id = %s",
        (doctor.department_id, hospital_id),
    )
    department = c.fetchone()
    if not department:
        conn.close()
        logger.error(
            f"Department not found: id={doctor.department_id}, hospital_id={hospital_id}"
        )
        raise HTTPException(
            status_code=404,
            detail="Department not found or not in the specified hospital",
        )

    # Check if user exists
    c.execute("SELECT id, role FROM users WHERE username = %s", (doctor.username,))
    user = c.fetchone()
    if user:
        user_id, user_role = user
        logger.info(f"Found existing user: id={user_id}, role={user_role}")
        if user_role != "doctor":
            c.execute("UPDATE users SET role = 'doctor' WHERE id = %s", (user_id,))
    else:
        # Create new user
        user_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash(doctor.password)
        created_at = datetime.utcnow()
        try:
            c.execute(
                """
                INSERT INTO users (id, username, email, password, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    doctor.username,
                    doctor.email,
                    hashed_password,
                    "doctor",
                    created_at,
                ),
            )
            logger.info(f"Created new user: id={user_id}, username={doctor.username}")
        except psycopg2.IntegrityError as e:
            conn.close()
            logger.error(f"User creation failed: {str(e)}")
            raise HTTPException(
                status_code=400, detail="Username or email already exists"
            )

    # Check if doctor is already assigned to this department
    c.execute(
        "SELECT user_id FROM doctors WHERE user_id = %s AND department_id = %s",
        (user_id, doctor.department_id),
    )
    if c.fetchone():
        conn.close()
        logger.error(
            f"Doctor already assigned: user_id={user_id}, department_id={doctor.department_id}"
        )
        raise HTTPException(
            status_code=400, detail="Doctor already assigned to this department"
        )

    # Assign doctor to department with all fields from schema, REMOVE hospital_id
    c.execute(
        """
        INSERT INTO doctors (
            user_id, department_id, specialty, title, phone, bio,
            license_number, years_experience, education
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            user_id,
            doctor.department_id,
            doctor.specialty,
            doctor.title,
            doctor.phone,
            doctor.bio,
            doctor.license_number,
            doctor.years_experience,
            doctor.education,
        ),
    )

    # Initialize availability (Mon–Sat, 9 AM–6 PM, 30-min slots)
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    slots = [
        ("09:00", "09:30"),
        ("09:30", "10:00"),
        ("10:00", "10:30"),
        ("10:30", "11:00"),
        ("11:00", "11:30"),
        ("11:30", "12:00"),
        ("12:00", "12:30"),
        ("12:30", "13:00"),
        ("13:00", "13:30"),
        ("13:30", "14:00"),
        ("14:00", "14:30"),
        ("14:30", "15:00"),
        ("15:00", "15:30"),
        ("15:30", "16:00"),
        ("16:00", "16:30"),
        ("16:30", "17:00"),
        ("17:00", "17:30"),
        ("17:30", "18:00"),
    ]
    for day in days:
        for start, end in slots:
            availability_id = str(uuid.uuid4())
            c.execute(
                """
                INSERT INTO doctor_availability (id, user_id, day_of_week, start_time, end_time)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (availability_id, user_id, day, start, end),
            )

    conn.commit()
    conn.close()

    logger.info(
        f"Assigned doctor {doctor.username} to department {doctor.department_id}"
    )
    return {"message": f"Doctor {doctor.username} assigned to department"}


@router.get("/api/doctors", response_model=List[DoctorResponse])
async def get_doctors(
    department_id: Optional[str] = None, current_user: dict = Depends(get_current_user)
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
        SELECT doc.user_id, u.username, u.email, doc.department_id, d.name,
               doc.specialty, doc.title, doc.phone, doc.bio, doc.license_number,
               doc.years_experience, doc.education, d.hospital_id, h.name
        FROM doctors doc
        JOIN users u ON doc.user_id = u.id
        JOIN departments d ON doc.department_id = d.id
        JOIN hospitals h ON d.hospital_id = h.id
    """
    params = []
    if department_id:
        query += " WHERE doc.department_id = %s"
        params.append(department_id)
    c.execute(query, params)
    doctors = [
        DoctorResponse(
            user_id=row[0],
            username=row[1],
            email=row[2],
            department_id=row[3],
            department_name=row[4],
            specialty=row[5],
            title=row[6],
            phone=row[7],
            bio=row[8],
            license_number=row[9],
            years_experience=row[10],
            education=row[11],
            hospital_id=row[12],
            hospital_name=row[13],
        )
        for row in c.fetchall()
    ]
    conn.close()
    logger.info(
        f"Fetched doctors for user {current_user['user_id']}, department_id: {department_id}"
    )
    return doctors


@router.get("/api/doctor/{doctor_id}/slots", response_model=List[TimeSlotResponse])
async def get_doctor_slots(
    doctor_id: str, date: str, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["user", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        # Validate date format
        appointment_date = datetime.strptime(date, "%Y-%m-%d")
        day_of_week = appointment_date.strftime("%A")
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid date format. Use YYYY-MM-DD"
        )

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    # Verify doctor exists
    c.execute(
        "SELECT id FROM users WHERE id = %s AND role = 'doctor'",
        (doctor_id,),
    )
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Get available slots for the doctor on the given day
    c.execute(
        """
        SELECT da.start_time, da.end_time
        FROM doctor_availability da
        WHERE da.user_id = %s AND da.day_of_week = %s
        AND NOT EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.doctor_id = da.user_id
            AND a.appointment_date = %s
            AND a.start_time = da.start_time
            AND a.status != 'cancelled'
        )
        ORDER BY da.start_time
        """,
        (doctor_id, day_of_week, date),
    )
    slots = [
        TimeSlotResponse(start_time=row[0], end_time=row[1]) for row in c.fetchall()
    ]
    conn.close()

    logger.info(f"Fetched available slots for doctor {doctor_id} on {date}")
    return slots


@router.delete("/api/doctors/{doctor_id}")
async def delete_doctor(doctor_id: str, current_user: dict = Depends(get_current_user)):
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

    # Get admin's hospital
    c.execute(
        "SELECT hospital_id FROM hospital_admins WHERE user_id = %s",
        (current_user["user_id"],),
    )
    hospital_id = c.fetchone()
    if not hospital_id:
        conn.close()
        raise HTTPException(status_code=404, detail="No hospital assigned")
    hospital_id = hospital_id[0]

    # Verify doctor exists and is in the admin's hospital
    c.execute(
        """
        SELECT doc.user_id
        FROM doctors doc
        JOIN departments d ON doc.department_id = d.id
        WHERE doc.user_id = %s AND d.hospital_id = %s
        """,
        (doctor_id, hospital_id),
    )
    if not c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=404, detail="Doctor not found or not in your hospital"
        )

    # Check for scheduled appointments
    c.execute(
        """
        SELECT COUNT(*) FROM appointments
        WHERE doctor_id = %s AND status = 'scheduled'
        """,
        (doctor_id,),
    )
    scheduled_appointments = c.fetchone()[0]
    if scheduled_appointments > 0:
        # Cancel all scheduled appointments
        c.execute(
            """
            UPDATE appointments
            SET status = 'cancelled'
            WHERE doctor_id = %s AND status = 'scheduled'
            """,
            (doctor_id,),
        )

    try:
        # Delete from doctor_availability
        c.execute("DELETE FROM doctor_availability WHERE user_id = %s", (doctor_id,))
        # Delete from doctors
        c.execute("DELETE FROM doctors WHERE user_id = %s", (doctor_id,))
        # Delete from users
        c.execute("DELETE FROM users WHERE id = %s", (doctor_id,))
        conn.commit()
        logger.info(f"Doctor {doctor_id} deleted by admin {current_user['user_id']}")
        return {"detail": "Doctor deleted"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()
