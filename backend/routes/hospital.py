from fastapi import APIRouter, Depends, HTTPException
from typing import List
from models.schemas import (
    HospitalResponse,
    HospitalCreate,
    HospitalAdminCreate,
    HospitalAdminAssign,
    UserResponse,
    AdminCreate,
    AdminUpdate,
)
from routes.auth import get_current_user, require_role
from config.settings import settings
import psycopg2
import uuid
from datetime import datetime
import logging
from passlib.context import CryptContext

router = APIRouter()
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/api/hospitals", response_model=HospitalResponse)
async def create_hospital(
    hospital: HospitalCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    hospital_id = str(uuid.uuid4())
    c.execute(
        """
        INSERT INTO hospitals (
            id, name, address, city, state, country, postal_code, phone, email, website, established_year, type, bed_count, created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            hospital_id,
            hospital.name,
            hospital.address,
            getattr(hospital, "city", ""),
            getattr(hospital, "state", ""),
            getattr(hospital, "country", ""),
            getattr(hospital, "postal_code", None),
            getattr(hospital, "phone", None),
            getattr(hospital, "email", None),
            getattr(hospital, "website", None),
            getattr(hospital, "established_year", None),
            getattr(hospital, "type", None),
            getattr(hospital, "bed_count", None),
            datetime.utcnow(),
        ),
    )
    conn.commit()
    conn.close()
    logger.info(f"Hospital created: {hospital.name}")
    return HospitalResponse(
        id=hospital_id,
        name=hospital.name,
        address=hospital.address,
        city=getattr(hospital, "city", ""),
        state=getattr(hospital, "state", ""),
        country=getattr(hospital, "country", ""),
        postal_code=getattr(hospital, "postal_code", None),
        phone=getattr(hospital, "phone", None),
        email=getattr(hospital, "email", None),
        website=getattr(hospital, "website", None),
        established_year=getattr(hospital, "established_year", None),
        type=getattr(hospital, "type", None),
        bed_count=getattr(hospital, "bed_count", None),
        created_at=str(datetime.utcnow()),
    )


@router.delete("/api/hospitals/{hospital_id}")
async def delete_hospital(
    hospital_id: str, current_user: dict = Depends(require_role("super_admin"))
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute("SELECT id FROM hospitals WHERE id = %s", (hospital_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Hospital not found")
    c.execute("DELETE FROM hospitals WHERE id = %s", (hospital_id,))
    conn.commit()
    conn.close()
    logger.info(
        f"Hospital deleted: {hospital_id} by super_admin: {current_user['user_id']}"
    )
    return {"detail": "Hospital deleted"}


@router.get("/api/hospitals", response_model=list[HospitalResponse])
async def list_hospitals(current_user: dict = Depends(get_current_user)):
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
        SELECT id, name, address, city, state, country, postal_code, phone, email, website, established_year, type, bed_count, created_at
        FROM hospitals
    """
    )
    hospitals = [
        HospitalResponse(
            id=row[0],
            name=row[1],
            address=row[2],
            city=row[3],
            state=row[4],
            country=row[5],
            postal_code=row[6],
            phone=row[7],
            email=row[8],
            website=row[9],
            established_year=row[10],
            type=row[11],
            bed_count=row[12],
            created_at=str(row[13]) if row[13] else None,
        )
        for row in c.fetchall()
    ]
    conn.close()
    logger.info(
        f"Hospitals listed for user: {current_user['user_id']}, role: {current_user['role']}"
    )
    return hospitals


@router.put("/api/hospitals/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: str,
    hospital: HospitalCreate,
    current_user: dict = Depends(require_role("super_admin")),
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute("SELECT id FROM hospitals WHERE id = %s", (hospital_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Hospital not found")
    try:
        c.execute(
            """
            UPDATE hospitals SET name = %s, address = %s, city = %s, state = %s, country = %s, postal_code = %s, phone = %s, email = %s, website = %s, established_year = %s, type = %s, bed_count = %s WHERE id = %s
            """,
            (
                hospital.name,
                hospital.address,
                getattr(hospital, "city", ""),
                getattr(hospital, "state", ""),
                getattr(hospital, "country", ""),
                getattr(hospital, "postal_code", None),
                getattr(hospital, "phone", None),
                getattr(hospital, "email", None),
                getattr(hospital, "website", None),
                getattr(hospital, "established_year", None),
                getattr(hospital, "type", None),
                getattr(hospital, "bed_count", None),
                hospital_id,
            ),
        )
        conn.commit()
        logger.info(
            f"Hospital updated: {hospital_id} by super_admin: {current_user['user_id']}"
        )
        return HospitalResponse(
            id=hospital_id,
            name=hospital.name,
            address=hospital.address,
            city=getattr(hospital, "city", ""),
            state=getattr(hospital, "state", ""),
            country=getattr(hospital, "country", ""),
            postal_code=getattr(hospital, "postal_code", None),
            phone=getattr(hospital, "phone", None),
            email=getattr(hospital, "email", None),
            website=getattr(hospital, "website", None),
            established_year=getattr(hospital, "established_year", None),
            type=getattr(hospital, "type", None),
            bed_count=getattr(hospital, "bed_count", None),
            created_at=None,
        )
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Hospital name already exists")
    finally:
        conn.close()


@router.get("/api/admins", response_model=List[UserResponse])
async def get_admins(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "super_admin":
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
        SELECT u.id, u.username, u.email, u.role, h.id as hospital_id, h.name as hospital_name
        FROM users u
        LEFT JOIN hospital_admins ha ON u.id = ha.user_id
        LEFT JOIN hospitals h ON ha.hospital_id = h.id
        WHERE u.role = 'admin'
        """
    )
    admins = [
        UserResponse(
            id=row[0],
            username=row[1],
            email=row[2],
            role=row[3],
            hospital_id=row[4],
            hospital_name=row[5],
        )
        for row in c.fetchall()
    ]
    conn.close()
    logger.info("Fetched list of admins")
    return admins


@router.post("/api/admins")
async def create_admin(
    admin: AdminCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    # Check if username or email already exists
    c.execute(
        "SELECT id FROM users WHERE username = %s OR email = %s",
        (admin.username, admin.email),
    )
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Validate hospital_id if provided
    if admin.hospital_id:
        logger.info(f"Received hospital_id: {admin.hospital_id}")
        c.execute("SELECT id FROM hospitals WHERE id = %s", (admin.hospital_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Invalid hospital ID")

    # Generate user ID and hash password
    user_id = str(uuid.uuid4())
    hashed_password = pwd_context.hash(admin.password)
    created_at = datetime.utcnow()

    # Insert user
    try:
        c.execute(
            """
            INSERT INTO users (id, username, email, password, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                admin.username,
                admin.email,
                hashed_password,
                "admin",
                created_at,
            ),
        )

        # Assign to hospital if hospital_id is provided
        if admin.hospital_id:
            logger.info(
                f"Attempting to assign admin {user_id} to hospital {admin.hospital_id}"
            )
            # Check if this admin is already assigned to any hospital
            c.execute(
                "SELECT hospital_id FROM hospital_admins WHERE user_id = %s",
                (user_id,),
            )
            if c.fetchone():
                conn.close()
                logger.error(f"Admin {user_id} is already assigned to a hospital.")
                raise HTTPException(
                    status_code=400, detail="Admin is already assigned to a hospital"
                )
            # Check if this hospital already has an admin assigned
            c.execute(
                "SELECT user_id FROM hospital_admins WHERE hospital_id = %s",
                (admin.hospital_id,),
            )
            if c.fetchone():
                conn.close()
                logger.error(
                    f"Hospital {admin.hospital_id} already has an admin assigned."
                )
                raise HTTPException(
                    status_code=400,
                    detail="This hospital already has an admin assigned",
                )
            assigned_at = datetime.utcnow()
            c.execute(
                """
                INSERT INTO hospital_admins (hospital_id, user_id, assigned_at)
                VALUES (%s, %s, %s)
                """,
                (admin.hospital_id, user_id, assigned_at),
            )
            logger.info(
                f"Successfully assigned admin {user_id} to hospital {admin.hospital_id}"
            )

        conn.commit()
    except psycopg2.Error as e:
        conn.rollback()
        conn.close()
        logger.error(f"Database error during admin creation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()

    logger.info(
        f"Created admin user {user_id} by super_admin {current_user['user_id']}"
    )
    return {"message": "Admin created successfully"}


@router.delete("/api/admins/{admin_id}")
async def delete_admin(
    admin_id: str, current_user: dict = Depends(require_role("super_admin"))
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    # Verify user exists and is an admin
    c.execute("SELECT role FROM users WHERE id = %s", (admin_id,))
    user = c.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Admin not found")
    if user[0] != "admin":
        conn.close()
        raise HTTPException(status_code=400, detail="User is not an admin")

    try:
        # Delete from hospital_admins
        c.execute("DELETE FROM hospital_admins WHERE user_id = %s", (admin_id,))
        # Delete from users
        c.execute("DELETE FROM users WHERE id = %s", (admin_id,))
        conn.commit()
        logger.info(
            f"Admin {admin_id} deleted by super_admin {current_user['user_id']}"
        )
        return {"detail": "Admin deleted"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@router.post("/api/hospitals/{hospital_id}/assign-admin")
async def assign_hospital_admin(
    hospital_id: str,
    assignment: HospitalAdminAssign,
    current_user: dict = Depends(require_role("super_admin")),
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    c.execute("SELECT id FROM hospitals WHERE id = %s", (hospital_id,))
    if not c.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Hospital not found")
    c.execute("SELECT id, role FROM users WHERE id = %s", (assignment.user_id,))
    user = c.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    if user[1] != "admin":
        conn.close()
        raise HTTPException(status_code=400, detail="User must be an admin")
    # Check if this admin is already assigned to any hospital
    c.execute(
        "SELECT hospital_id FROM hospital_admins WHERE user_id = %s",
        (assignment.user_id,),
    )
    if c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400, detail="Admin is already assigned to a hospital"
        )
    # Check if this hospital already has an admin assigned
    c.execute(
        "SELECT user_id FROM hospital_admins WHERE hospital_id = %s",
        (hospital_id,),
    )
    if c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400, detail="This hospital already has an admin assigned"
        )
    assigned_at = datetime.utcnow()
    try:
        c.execute(
            "INSERT INTO hospital_admins (hospital_id, user_id, assigned_at) VALUES (%s, %s, %s)",
            (hospital_id, assignment.user_id, assigned_at),
        )
        conn.commit()
        logger.info(
            f"Admin {assignment.user_id} assigned to hospital {hospital_id} by super_admin: {current_user['user_id']}"
        )
        return {"detail": "Admin assigned to hospital"}
    except psycopg2.IntegrityError:
        conn.rollback()
        raise HTTPException(
            status_code=400, detail="Admin already assigned to this hospital"
        )
    finally:
        conn.close()


@router.delete("/api/admins/{admin_id}/unassign")
async def unassign_hospital_admin(
    admin_id: str, current_user: dict = Depends(require_role("super_admin"))
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()
    # Verify user exists and is an admin
    c.execute("SELECT role FROM users WHERE id = %s", (admin_id,))
    user = c.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Admin not found")
    if user[0] != "admin":
        conn.close()
        raise HTTPException(status_code=400, detail="User is not an admin")
    # Check if admin is assigned to a hospital
    c.execute(
        "SELECT hospital_id FROM hospital_admins WHERE user_id = %s",
        (admin_id,),
    )
    if not c.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400, detail="Admin is not assigned to any hospital"
        )
    try:
        c.execute("DELETE FROM hospital_admins WHERE user_id = %s", (admin_id,))
        conn.commit()
        logger.info(
            f"Admin {admin_id} unassigned from hospital by super_admin: {current_user['user_id']}"
        )
        return {"detail": "Admin unassigned from hospital"}
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()


@router.put("/api/admins/{admin_id}")
async def update_admin(
    admin_id: str,
    admin: AdminUpdate,
    current_user: dict = Depends(require_role("super_admin")),
):
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    # Verify admin exists
    c.execute("SELECT role FROM users WHERE id = %s", (admin_id,))
    user = c.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Admin not found")
    if user[0] != "admin":
        conn.close()
        raise HTTPException(status_code=400, detail="User is not an admin")

    # Check if username or email is already taken by another user
    c.execute(
        "SELECT id FROM users WHERE (username = %s OR email = %s) AND id != %s",
        (admin.username, admin.email, admin_id),
    )
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username or email already exists")

    # Validate hospital_id if provided
    if admin.hospital_id:
        c.execute("SELECT id FROM hospitals WHERE id = %s", (admin.hospital_id,))
        if not c.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Invalid hospital ID")
        # Check if hospital is already assigned to another admin
        c.execute(
            "SELECT user_id FROM hospital_admins WHERE hospital_id = %s AND user_id != %s",
            (admin.hospital_id, admin_id),
        )
        if c.fetchone():
            conn.close()
            raise HTTPException(
                status_code=400, detail="Hospital is already assigned to another admin"
            )

    try:
        # Update user details
        update_fields = []
        update_values = []
        if admin.username:
            update_fields.append("username = %s")
            update_values.append(admin.username)
        if admin.email:
            update_fields.append("email = %s")
            update_values.append(admin.email)
        if admin.password:
            hashed_password = pwd_context.hash(admin.password)
            update_fields.append("password = %s")
            update_values.append(hashed_password)

        if update_fields:
            update_values.append(admin_id)
            c.execute(
                f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s",
                update_values,
            )

        # Update hospital assignment
        c.execute(
            "SELECT hospital_id FROM hospital_admins WHERE user_id = %s", (admin_id,)
        )
        current_hospital = c.fetchone()
        if admin.hospital_id:
            if current_hospital:
                if current_hospital[0] != admin.hospital_id:
                    # Update existing assignment
                    c.execute(
                        "UPDATE hospital_admins SET hospital_id = %s, assigned_at = %s WHERE user_id = %s",
                        (admin.hospital_id, datetime.utcnow(), admin_id),
                    )
            else:
                # Create new assignment
                c.execute(
                    "INSERT INTO hospital_admins (hospital_id, user_id, assigned_at) VALUES (%s, %s, %s)",
                    (admin.hospital_id, admin_id, datetime.utcnow()),
                )
        elif current_hospital and admin.hospital_id is None:
            # Remove hospital assignment
            c.execute("DELETE FROM hospital_admins WHERE user_id = %s", (admin_id,))

        conn.commit()
        logger.info(
            f"Admin {admin_id} updated by super_admin {current_user['user_id']}"
        )
        return {"message": "Admin updated successfully"}
    except psycopg2.Error as e:
        conn.rollback()
        logger.error(f"Database error during admin update: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    finally:
        conn.close()
