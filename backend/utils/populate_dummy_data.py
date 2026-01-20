import psycopg2
import uuid
from datetime import datetime
from passlib.context import CryptContext
from config.settings import settings
import logging

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_db_connection():
    return psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )


def populate_dummy_data():
    conn = get_db_connection()
    c = conn.cursor()
    now = datetime.utcnow()

    # Open the password file for writing (overwrite each run)
    password_file_path = "dummy_passwords.txt"
    password_file = open(password_file_path, "w")
    password_file.write("username,email,password,role\n")

    # 1. Super Admin
    super_admin_id = str(uuid.uuid4())
    try:
        c.execute("SELECT id FROM users WHERE username = %s", ("superadmin",))
        if not c.fetchone():
            password = "superadmin"
            c.execute(
                """
                INSERT INTO users (id, username, email, password, role, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    super_admin_id,
                    "superadmin",
                    "superadmin@gmail.com",
                    pwd_context.hash(password),
                    "super_admin",
                    now,
                ),
            )
            password_file.write(
                f"superadmin,superadmin@gmail.com,{password},super_admin\n"
            )
            logger.info("Super admin created.")
    except Exception as e:
        logger.error(f"Super admin error: {e}")

    # 2. Hospitals
    hospital_ids = []
    for i in range(5):
        hospital_id = str(uuid.uuid4())
        hospital_ids.append(hospital_id)
        name = f"Hospital_{i+1}"
        address = f"{100+i} Main St, City"
        lat = 30.0 + i
        lng = 70.0 + i
        try:
            c.execute("SELECT id FROM hospitals WHERE name = %s", (name,))
            if not c.fetchone():
                c.execute(
                    """
                    INSERT INTO hospitals (id, name, address, lat, lng, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (hospital_id, name, address, lat, lng, now),
                )
                logger.info(f"Hospital {name} created.")
        except Exception as e:
            logger.error(f"Hospital error: {e}")

    # 3. Admins (one per hospital)
    admin_ids = []
    for i, hospital_id in enumerate(hospital_ids):
        admin_id = str(uuid.uuid4())
        admin_ids.append(admin_id)
        username = f"admin{i+1}"
        email = f"admin{i+1}@gmail.com"
        try:
            c.execute("SELECT id FROM users WHERE username = %s", (username,))
            if not c.fetchone():
                password = "admin"
                c.execute(
                    """
                    INSERT INTO users (id, username, email, password, role, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        admin_id,
                        username,
                        email,
                        pwd_context.hash(password),
                        "admin",
                        now,
                    ),
                )
                password_file.write(f"{username},{email},{password},admin\n")
                logger.info(f"Admin {username} created.")
            # Assign admin to hospital
            c.execute(
                "SELECT * FROM hospital_admins WHERE hospital_id = %s AND user_id = %s",
                (hospital_id, admin_id),
            )
            if not c.fetchone():
                c.execute(
                    """
                    INSERT INTO hospital_admins (hospital_id, user_id, assigned_at)
                    VALUES (%s, %s, %s)
                    """,
                    (hospital_id, admin_id, now),
                )
                logger.info(f"Admin {username} assigned to {hospital_id}.")
        except Exception as e:
            logger.error(f"Admin error: {e}")

    # 4. Departments (3 per hospital)
    department_ids = []
    department_names = ["Cardiology", "Dermatology", "Neurology"]
    for i, hospital_id in enumerate(hospital_ids):
        for dept_name in department_names:
            dept_id = str(uuid.uuid4())
            department_ids.append((dept_id, hospital_id, dept_name))
            try:
                c.execute(
                    "SELECT id FROM departments WHERE name = %s AND hospital_id = %s",
                    (dept_name, hospital_id),
                )
                if not c.fetchone():
                    c.execute(
                        """
                        INSERT INTO departments (id, hospital_id, name)
                        VALUES (%s, %s, %s)
                        """,
                        (dept_id, hospital_id, dept_name),
                    )
                    logger.info(
                        f"Department {dept_name} created in hospital {hospital_id}."
                    )
            except Exception as e:
                logger.error(f"Department error: {e}")

    # 5. Doctors (2 per department)
    for dept_id, hospital_id, dept_name in department_ids:
        for j in range(2):
            doctor_id = str(uuid.uuid4())
            username = f"doctor_{dept_name.lower()}_{j+1}_{hospital_id[:4]}"
            email = f"{username}@gmail.com"
            try:
                c.execute("SELECT id FROM users WHERE username = %s", (username,))
                if not c.fetchone():
                    password = "doctor"
                    c.execute(
                        """
                        INSERT INTO users (id, username, email, password, role, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (
                            doctor_id,
                            username,
                            email,
                            pwd_context.hash(password),
                            "doctor",
                            now,
                        ),
                    )
                    password_file.write(f"{username},{email},{password},doctor\n")
                    logger.info(f"Doctor {username} created.")
                # Insert into doctors table
                c.execute(
                    "SELECT * FROM doctors WHERE user_id = %s AND department_id = %s",
                    (doctor_id, dept_id),
                )
                if not c.fetchone():
                    c.execute(
                        """
                        INSERT INTO doctors (user_id, department_id, specialty, title, phone, bio)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (
                            doctor_id,
                            dept_id,
                            f"Specialty {dept_name}",
                            f"Dr. {username.title()}",
                            f"+1234567890{j}",
                            f"Bio for {username}",
                        ),
                    )
                    logger.info(
                        f"Doctor {username} assigned to department {dept_name}."
                    )
            except Exception as e:
                logger.error(f"Doctor error: {e}")

    conn.commit()
    conn.close()
    password_file.close()
    logger.info("Dummy data population complete.")


if __name__ == "__main__":
    populate_dummy_data()
