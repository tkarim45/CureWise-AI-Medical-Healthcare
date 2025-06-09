import os
import json
import logging
import re
import base64
from fastapi import (
    FastAPI,
    HTTPException,
    Depends,
    UploadFile,
    File,
    Form,
    Request,
    BackgroundTasks,
)
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
import psycopg2
from models.schemas import *
import uuid
from datetime import datetime, timedelta, date
from typing import Optional, List
import requests
from config.settings import settings
from utils.db import init_db
from utils.parser import *
from routes.auth import *
from routes import auth
from utils.pineconeutils import *
from utils.email import *
from utils.agents import *
from routes.hospital import router as hospital_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

init_db()

app = FastAPI()
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


@app.on_event("startup")
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


@app.post("/chatbot")
async def chatbot(
    request: ChatbotRequest, current_user: dict = Depends(get_current_user)
):
    """Handle chatbot queries using the agentic system."""
    try:
        logger.info(f"Chatbot query: {request.query}")
        response = await appointment_booking_agent(
            request.query, current_user["user_id"]
        )
        return response
    except Exception as e:
        logger.error(f"Error in chatbot: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/emergency/hospitals", response_model=dict)
async def get_nearby_hospitals(
    lat: float, lng: float, current_user: dict = Depends(get_current_user)
):
    try:
        logger.info(
            f"Fetching hospitals for lat: {lat}, lng: {lng}, user: {current_user['user_id']}"
        )
        overpass_url = "http://overpass-api.de/api/interpreter"
        query = f"""
        [out:json];
        node["amenity"="hospital"](around:10000,{lat},{lng});
        out body;
        """
        response = requests.post(overpass_url, data=query)
        response.raise_for_status()
        data = response.json()
        hospitals = []
        for element in data["elements"][:15]:
            hospital = {
                "name": element["tags"].get("name", "Unnamed Hospital"),
                "address": element["tags"].get("addr:street", "Address not available"),
                "lat": element["lat"],
                "lng": element["lon"],
                "doctorAvailability": (
                    True if hash(element["tags"].get("name", "")) % 2 == 0 else False
                ),
            }
            hospitals.append(hospital)
        logger.info(f"Found {len(hospitals)} hospitals")
        return {"hospitals": hospitals}
    except requests.RequestException as e:
        logger.error(f"Overpass API error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Overpass API error: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in get_nearby_hospitals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


@app.get("/api/debug/version")
async def debug_version(current_user: dict = Depends(get_current_user)):
    """Return the version of the running main.py to verify correct code."""
    logger.info(f"Debug version requested by user: {current_user['user_id']}")
    return {"version": "7a8c3e9d-2b1f-4e7c-9f2a-5c3d8e6f9012", "file": "main.py"}


@app.post("/api/medical-query")
async def medical_query(
    query: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
    request: Request = None,
):
    """Process blood report and/or answer query using Groq API."""
    try:
        form_data = await request.form()
        logger.info(
            f"Received medical query for user: {current_user['user_id']}, raw_query: {query!r}, file: {file.filename if file else None}, form_data: {dict(form_data)}"
        )

        json_output = None
        response = None

        if file:
            file_path = f"uploads/{current_user['user_id']}_{file.filename}"
            logger.info(f"Saving file: {file_path}")
            os.makedirs("uploads", exist_ok=True)
            with open(file_path, "wb") as f:
                f.write(await file.read())
            report_text = await parse_blood_report(file_path)

            # Enhanced JSON parsing with error handling
            try:
                json_output, raw_json = await structure_report(report_text)
                logger.info(
                    f"Raw JSON from structure_report: {raw_json[:200]}..."
                )  # Log raw JSON for debugging
                # Validate JSON structure
                if not isinstance(json_output, dict):
                    logger.error("structure_report returned invalid JSON structure")
                    json_output = None  # Fallback to None if JSON is invalid
            except json.JSONDecodeError as json_err:
                logger.error(f"JSON parsing error in structure_report: {str(json_err)}")
                json_output = None  # Fallback to None if JSON parsing fails
            except Exception as e:
                logger.error(f"Error in structure_report: {str(e)}")
                json_output = None  # Fallback to None for other errors

            os.remove(file_path)
            logger.info(f"File processed and deleted: {file_path}")

            effective_query = (
                query.strip() if query else "Explain my blood test results"
            )
            logger.info(f"Effective query for file upload: {effective_query}")
        else:
            if query is None or query.strip() == "":
                logger.error("No query provided for follow-up question")
                raise HTTPException(
                    status_code=400,
                    detail="A non-empty query is required when no file is uploaded.",
                )

            history = get_chat_history(current_user["user_id"])
            if history and any(h["report_json"] for h in history):
                logger.info(
                    f"Retrieving stored report for user: {current_user['user_id']}"
                )
                json_output = json.loads(history[-1]["report_json"])
            else:
                logger.info("No stored report, proceeding with query only")
                json_output = None

            effective_query = query.strip()
            logger.info(f"Effective query for follow-up: {effective_query}")

        prompt = f"""
            You are a friendly medical AI assistant who analyzes Complete Blood Count (CBC) results and answers medical questions in simple, kind words for non-experts. Follow these guidelines:
            1. Keep answers 100-150 words, clear, and focused.
            2. Use analogies (e.g., "Red blood cells are like delivery trucks carrying oxygen").
            3. Avoid medical jargon; explain terms simply.
            4. Suggest 1-2 next steps (e.g., "Discuss with your doctor about possible iron supplements").
            5. Highlight urgency (e.g., "If you feel very weak or dizzy, see a doctor right away").
            6. Emphasize this is not a diagnosis and recommend consulting a doctor.
            7. Output only the answer text, without labels like "assistant:" or code blocks.

            For CBC analysis, focus on:
            - Red blood cell count (RBC), hemoglobin, hematocrit (normal ranges: males 4.5-6.1 million/mcL, 13-17 g/dL, 40-55%; females 4.0-5.4 million/mcL, 11.5-15.5 g/dL, 36-48%).
            - White blood cell count (WBC, normal 4,000-10,000/mcL) and differential (e.g., neutrophils, lymphocytes).
            - Platelet count (normal 150,000-400,000/mcL).
            - If available, mean corpuscular volume (MCV, normal 80-100 fL), mean corpuscular hemoglobin (MCH, normal 27-31 pg), and red cell distribution width (RDW, normal 12-15%).
            - Compare results to normal ranges, explain abnormalities, and suggest possible causes (e.g., anemia, infection).

            Current Query: {effective_query}
        """

        if json_output:
            patient_age = json_output.get("patient_info", {}).get("age", "Unknown")
            patient_gender = json_output.get("patient_info", {}).get(
                "gender", "Unknown"
            )
            prompt += f"""
                Patient Age: {patient_age}
                Patient Gender: {patient_gender}
                Blood Test Results (JSON):
                {json.dumps(json_output, indent=2)}
            """
        else:
            prompt += "\nNo blood test results available."

        logger.info(f"Sending prompt to Groq API: {prompt[:100]}...")
        # Call Groq API
        client = Groq(api_key=settings.GROQ_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            stream=False,
        )

        # Extract the response
        raw_response = chat_completion.choices[0].message.content
        if not raw_response:
            logger.error("No content in Groq API response")
            raise HTTPException(
                status_code=500, detail="No content in Groq API response"
            )

        # Clean the response
        cleaned_response = raw_response.strip()
        cleaned_response = re.sub(
            r"^(assistant:|[\[\{]?(ANSWER|RESPONSE)[\]\}]?:?\s*)",
            "",
            cleaned_response,
            flags=re.IGNORECASE,
        )
        cleaned_response = re.sub(
            r"```(?:json)?\s*(.*?)\s*```", r"\1", cleaned_response, flags=re.DOTALL
        )
        cleaned_response = re.sub(r"\s*(</s>|[EOT]|\[.*?\])$", "", cleaned_response)
        if not cleaned_response.strip():
            logger.error("Cleaned response is empty")
            raise HTTPException(status_code=500, detail="Cleaned response is empty")

        response = cleaned_response.strip()
        logger.info(f"Parsed Groq API response: {response[:100]}...")

        store_chat_history(
            user_id=current_user["user_id"],
            query=effective_query,
            report_json=json.dumps(json_output) if json_output else "",
            response=response,
        )

        logger.info("Query processed successfully")
        await asyncio.sleep(5)  # Add 10-second delay before returning response
        return {"structured_report": json_output, "response": response}
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@app.post("/api/acne-analysis")
async def acne_analysis(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        logger.info(
            f"Received acne image for user: {current_user['user_id']}, file: {image.filename}"
        )
        if image.content_type not in ["image/jpeg", "image/png"]:
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(
                status_code=400, detail="Only JPEG or PNG images are supported."
            )
        image_data = await image.read()
        base64_image = base64.b64encode(image_data).decode("utf-8")
        image_url = f"data:{image.content_type};base64,{base64_image}"
        response = await analyze_acne_image(image_url, current_user["user_id"])
        logger.info("Acne image analysis completed successfully")
        await asyncio.sleep(5)  # Add 10-second delay before returning response
        return {"response": response}
    except Exception as e:
        logger.error(f"Error processing acne image: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error processing acne image: {str(e)}"
        )


##########################################################################################
##########################################################################################
############################ Admin  ###################################
##########################################################################################
##########################################################################################
##########################################################################################


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
        "SELECT h.id, h.name, h.address, h.lat, h.lng FROM hospitals h JOIN hospital_admins ha ON h.id = ha.hospital_id WHERE ha.user_id = %s",
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
        lat=hospital[3],
        lng=hospital[4],
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


@app.post("/api/doctors", response_model=dict)
async def assign_doctor(
    doctor: DoctorCreate, current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    logger.info(
        f"Assigning doctor: username={doctor.username}, department_id={doctor.department_id}, email={doctor.email}"
    )

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
        logger.error("No hospital assigned to admin")
        raise HTTPException(status_code=404, detail="No hospital assigned")
    hospital_id = hospital_id[0]
    logger.info(f"Admin hospital_id: {hospital_id}")

    # Verify department belongs to admin's hospital
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
            status_code=404, detail="Department not found or not in your hospital"
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

    # Assign doctor to department
    c.execute(
        """
        INSERT INTO doctors (user_id, department_id, specialty, title, phone, bio)
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            user_id,
            doctor.department_id,
            doctor.specialty,
            doctor.title,
            doctor.phone,
            doctor.bio,
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


@app.get("/api/doctors", response_model=List[DoctorResponse])
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
               doc.specialty, doc.title, doc.phone, doc.bio
        FROM doctors doc
        JOIN users u ON doc.user_id = u.id
        JOIN departments d ON doc.department_id = d.id
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
        )
        for row in c.fetchall()
    ]
    conn.close()
    logger.info(
        f"Fetched doctors for user {current_user['user_id']}, department_id: {department_id}"
    )
    return doctors


@app.get(
    "/api/doctors/{doctor_id}/availability", response_model=List[AvailabilityResponse]
)
async def get_doctor_availability(
    doctor_id: str, current_user: dict = Depends(get_current_user)
):
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
        SELECT id, user_id, day_of_week, start_time, end_time
        FROM doctor_availability
        WHERE user_id = %s
        """,
        (doctor_id,),
    )
    availability = [
        AvailabilityResponse(
            id=row[0],
            user_id=row[1],
            day_of_week=row[2],
            start_time=row[3],
            end_time=row[4],
        )
        for row in c.fetchall()
    ]
    conn.close()

    logger.info(f"Fetched availability for doctor {doctor_id}")
    return availability


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


@app.get("/api/doctor/{doctor_id}/slots", response_model=List[TimeSlotResponse])
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


##########################################################################################
##########################################################################################
############################ Doctor  ###################################
##########################################################################################
##########################################################################################
##########################################################################################


@app.get("/api/doctor/department", response_model=DepartmentResponse)
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
        SELECT d.id, d.hospital_id, d.name, h.name
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
    )


@app.get("/api/doctor/appointments/today", response_model=List[AppointmentResponse])
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


@app.get("/api/doctor/appointments/week", response_model=List[AppointmentResponse])
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


@app.get(
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


##########################################################################################
##########################################################################################
############################ Super Admin  ###################################
##########################################################################################
##########################################################################################
##########################################################################################


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


@app.delete("/api/doctors/{doctor_id}")
async def delete_doctor(
    doctor_id: str, current_user: dict = Depends(require_role("admin"))
):
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


@app.post("/api/general-query")
async def general_query(
    request: GeneralQueryRequest, current_user: dict = Depends(get_current_user)
):
    """Process general medical queries using the agentic system."""
    try:
        query = request.query
        if not query.strip():
            logger.error("Empty query provided")
            raise HTTPException(status_code=400, detail="A non-empty query is required")

        logger.info(f"Processing query for user {current_user['user_id']}: {query}")
        response = await appointment_booking_agent(query, current_user["user_id"])

        # Log response safely, handling both string and dictionary cases
        if isinstance(response["response"], str):
            logger.info(
                f"Query processed successfully: {response['response'][:100]}..."
            )
        else:
            logger.info(f"Query processed successfully: {response['response']}")

        return response
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


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
