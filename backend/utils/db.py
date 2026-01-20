import psycopg2
import logging
from config.settings import settings
import uuid
from datetime import datetime
from passlib.context import CryptContext

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def init_db():
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    conn.set_session(autocommit=True)
    c = conn.cursor()

    # Users table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            profile_picture TEXT,
            date_of_birth DATE,
            gender TEXT,
            address TEXT,
            created_at TIMESTAMP
        )
        """
    )

    # Check if role column exists and add if not
    c.execute(
        """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
        """
    )
    if not c.fetchone():
        c.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")

    # Hospitals table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS hospitals (
            id UUID PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            city TEXT NOT NULL,
            state TEXT NOT NULL,
            country TEXT NOT NULL,
            postal_code TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            established_year INT,
            type TEXT, -- e.g., General, Specialty, Clinic
            bed_count INT,
            created_at TIMESTAMP
        )
        """
    )

    # Hospital admins table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS hospital_admins (
            hospital_id UUID,
            user_id UUID,
            assigned_at TIMESTAMP,
            PRIMARY KEY (hospital_id, user_id),
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )

    # Departments table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS departments (
            id UUID PRIMARY KEY,
            hospital_id UUID NOT NULL,
            name TEXT NOT NULL,
            floor TEXT,
            phone TEXT,
            head_id UUID,
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
            FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL
        )
        """
    )

    # Doctors table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS doctors (
            user_id UUID NOT NULL,
            department_id UUID NOT NULL,
            specialty TEXT NOT NULL,
            title TEXT NOT NULL,
            phone TEXT,
            bio TEXT,
            license_number TEXT,
            years_experience INT,
            education TEXT,
            PRIMARY KEY (user_id, department_id),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
        )
        """
    )

    # Doctor availability table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS doctor_availability (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            day_of_week TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            location TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        """
    )

    # Appointments table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS appointments (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            doctor_id UUID NOT NULL,
            department_id UUID NOT NULL,
            hospital_id UUID NOT NULL,
            appointment_date DATE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            status TEXT NOT NULL,
            reason TEXT,
            notes TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
            FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
            CONSTRAINT unique_doctor_slot UNIQUE (doctor_id, appointment_date, start_time)
        )
        """
    )

    # Medical history table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS medical_history (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL,
            conditions TEXT,
            allergies TEXT,
            notes TEXT,
            updated_at TIMESTAMP,
            updated_by UUID,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
        )
        """
    )

    # General chat history table
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS general_chat_history (
            id UUID PRIMARY KEY,
            user_id UUID,
            query TEXT,
            response TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )

    conn.close()
    logger.info("Database initialized successfully")


def get_db_connection():
    """Create a new database connection."""
    return psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )


async def get_user(username: str):
    """Retrieve user by username."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        """
        SELECT id, username, email, password, role, created_at 
        FROM users 
        WHERE username = %s
        """,
        (username,),
    )
    user = c.fetchone()
    conn.close()
    if user:
        from models.schemas import UserInDB
        from datetime import datetime

        return UserInDB(
            id=user[0],
            username=user[1],
            email=user[2],
            hashed_password=user[3],
            role=user[4],
            created_at=user[5],  # Already a timestamp
        )
    return None


async def initialize_users():
    logger.info("Checking for default Super Admin and Admin users...")
    conn = psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )
    c = conn.cursor()

    # Super Admin
    super_admin_data = {
        "username": "superadmin",
        "email": "superadmin@gmail.com",
        "password": "superadmin",
        "role": "super_admin",
    }

    # Check if Super Admin exists
    c.execute(
        "SELECT id FROM users WHERE username = %s", (super_admin_data["username"],)
    )
    if not c.fetchone():
        user_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash(super_admin_data["password"])
        created_at = datetime.utcnow()
        try:
            c.execute(
                """
                INSERT INTO users (id, username, email, password, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    super_admin_data["username"],
                    super_admin_data["email"],
                    hashed_password,
                    super_admin_data["role"],
                    created_at,
                ),
            )
            conn.commit()
            logger.info(f"Created Super Admin user: {super_admin_data['username']}")
        except psycopg2.IntegrityError as e:
            conn.rollback()
            logger.error(f"Failed to create Super Admin: {str(e)}")
    else:
        logger.info(f"Super Admin user {super_admin_data['username']} already exists")

    # Admin
    admin_data = {
        "username": "admin",
        "email": "admin@gmail.com",
        "password": "admin",
        "role": "admin",
    }

    # Check if Admin exists
    c.execute("SELECT id FROM users WHERE username = %s", (admin_data["username"],))
    if not c.fetchone():
        user_id = str(uuid.uuid4())
        hashed_password = pwd_context.hash(admin_data["password"])
        created_at = datetime.utcnow()
        try:
            c.execute(
                """
                INSERT INTO users (id, username, email, password, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    admin_data["username"],
                    admin_data["email"],
                    hashed_password,
                    admin_data["role"],
                    created_at,
                ),
            )
            conn.commit()
            logger.info(f"Created Admin user: {admin_data['username']}")
        except psycopg2.IntegrityError as e:
            conn.rollback()
            logger.error(f"Failed to create Admin: {str(e)}")
    else:
        logger.info(f"Admin user {admin_data['username']} already exists")

    conn.close()
