import psycopg2
from typing import List, Dict, Optional, Callable
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel
import re
from config.settings import settings
from utils.zillisutils import (
    document_chain as retrieval_chain,
    get_general_chat_history,
    store_general_chat_history,
)
from datetime import datetime, timedelta
import uuid
import logging
import json
import asyncio

# Assuming send_confirmation_email is defined elsewhere and imported
from utils.email import (
    send_confirmation_email,
)  # Adjust import based on your project structure

logger = logging.getLogger(__name__)

# Initialize LLM
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.3)


# Define tools
class Tool(BaseModel):
    name: str
    description: str
    function: Callable  # Use typing.Callable instead of callable

    class Config:
        arbitrary_types_allowed = True


class RouterResponse(BaseModel):
    action: str
    parameters: Dict


class DatabaseKnowledgeResponse(BaseModel):
    department_name: Optional[str]
    department_id: Optional[str]
    doctors: List[Dict]
    error: Optional[str]


def get_db_connection():
    return psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )


def get_hospitals() -> List[Dict]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT id, name, address, lat, lng FROM hospitals")
    hospitals = [
        {"id": row[0], "name": row[1], "address": row[2], "lat": row[3], "lng": row[4]}
        for row in c.fetchall()
    ]
    conn.close()
    return hospitals


def get_doctors(
    department_id: Optional[str] = None, hospital_id: Optional[str] = None
) -> List[Dict]:
    conn = get_db_connection()
    c = conn.cursor()
    query = """
        SELECT u.id, u.username, u.email, d.department_id, dep.name, d.specialty, d.title, d.phone, d.bio
        FROM users u
        JOIN doctors d ON u.id = d.user_id
        JOIN departments dep ON d.department_id = dep.id
        WHERE u.role = 'doctor'
    """
    params = []
    if department_id:
        query += " AND d.department_id = %s"
        params.append(department_id)
    if hospital_id:
        query += " AND dep.hospital_id = %s"
        params.append(hospital_id)
    c.execute(query, params)
    doctors = [
        {
            "user_id": row[0],
            "username": row[1],
            "email": row[2],
            "department_id": row[3],
            "department_name": row[4],
            "specialty": row[5],
            "title": row[6],
            "phone": row[7],
            "bio": row[8],
        }
        for row in c.fetchall()
    ]
    conn.close()
    return doctors


def get_doctor_availability(doctor_id: str, date: Optional[str] = None) -> List[Dict]:
    conn = get_db_connection()
    c = conn.cursor()
    query = """
        SELECT id, day_of_week, start_time, end_time
        FROM doctor_availability
        WHERE user_id = %s
    """
    params = [doctor_id]
    if date:
        day_of_week = datetime.strptime(date, "%Y-%m-%d").strftime("%A")
        query += " AND day_of_week = %s"
        params.append(day_of_week)
    c.execute(query, params)
    availability = [
        {"id": row[0], "day_of_week": row[1], "start_time": row[2], "end_time": row[3]}
        for row in c.fetchall()
    ]

    # Add booking status
    for slot in availability:
        slot_date = date
        if not slot_date:
            today = datetime.now()
            days_of_week = [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ]
            target_day_index = days_of_week.index(slot["day_of_week"])
            current_day_index = today.weekday()
            days_until_target = (target_day_index - current_day_index + 7) % 7
            if days_until_target == 0:
                days_until_target = 7
            slot_date = (today + timedelta(days=days_until_target)).strftime("%Y-%m-%d")

        c.execute(
            """
            SELECT id FROM appointments
            WHERE doctor_id = %s AND appointment_date = %s AND start_time = %s AND status != 'cancelled'
            """,
            (doctor_id, slot_date, slot["start_time"]),
        )
        slot["is_booked"] = bool(c.fetchone())

    conn.close()
    return availability


async def async_send_confirmation_email(
    recipient_email: str,
    patient_username: str,
    doctor_username: str,
    department_name: str,
    appointment_date: str,
    start_time: str,
    hospital_id: str,
):
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(
            None,
            send_confirmation_email,
            recipient_email,
            patient_username,
            doctor_username,
            department_name,
            appointment_date,
            start_time,
            hospital_id,
        )
        logger.info(f"Confirmation email sent to {recipient_email}")
    except Exception as e:
        logger.error(
            f"Failed to send confirmation email to {recipient_email}: {str(e)}"
        )


def book_appointment(
    user_id: str,
    doctor_id: str,
    department_id: str,
    hospital_id: str,
    appointment_date: str,
    start_time: str,
    end_time: str,
) -> Dict:
    logger.debug(f"book_appointment inputs: {locals()}")

    # Validate inputs
    for param, value in locals().items():
        if not isinstance(value, str):
            logger.error(f"Invalid type for {param}: {type(value)}, value={value}")
            raise ValueError(f"{param} must be a string")

    conn = get_db_connection()
    c = conn.cursor()

    # Verify doctor exists and get username
    c.execute(
        """
        SELECT u.id, u.username
        FROM users u
        WHERE u.id = %s AND u.role = 'doctor'
        """,
        (doctor_id,),
    )
    doctor = c.fetchone()
    logger.debug(f"Doctor query: result={doctor}, type={type(doctor)}")
    if not doctor:
        conn.close()
        raise ValueError("Doctor not found")
    if not isinstance(doctor, tuple):
        conn.close()
        raise ValueError(f"Invalid doctor query result type: {type(doctor)}")
    doctor_id, doctor_username = doctor

    # Verify department exists and get name
    c.execute(
        """
        SELECT d.id, d.name
        FROM departments d
        WHERE d.id = %s
        """,
        (department_id,),
    )
    department = c.fetchone()
    logger.debug(f"Department query: result={department}, type={type(department)}")
    if not department:
        conn.close()
        raise ValueError("Department not found")
    if not isinstance(department, tuple):
        conn.close()
        raise ValueError(f"Invalid department query result type: {type(department)}")
    department_id, department_name = department

    # Verify hospital exists
    c.execute("SELECT id FROM hospitals WHERE id = %s", (hospital_id,))
    hospital = c.fetchone()
    logger.debug(f"Hospital query: result={hospital}, type={type(hospital)}")
    if not hospital:
        conn.close()
        raise ValueError("Hospital not found")
    if not isinstance(hospital, tuple):
        conn.close()
        raise ValueError(f"Invalid hospital query result type: {type(hospital)}")

    # Verify slot availability
    c.execute(
        """
        SELECT id FROM doctor_availability
        WHERE user_id = %s AND day_of_week = %s AND start_time = %s AND end_time = %s
        """,
        (
            doctor_id,
            datetime.strptime(appointment_date, "%Y-%m-%d").strftime("%A"),
            start_time,
            end_time,
        ),
    )
    availability = c.fetchone()
    logger.debug(
        f"Availability query: result={availability}, type={type(availability)}"
    )
    if not availability:
        conn.close()
        raise ValueError("Slot not available")
    if not isinstance(availability, tuple):
        conn.close()
        raise ValueError(
            f"Invalid availability query result type: {type(availability)}"
        )

    # Check for booking conflict
    c.execute(
        """
        SELECT id FROM appointments
        WHERE doctor_id = %s AND appointment_date = %s AND start_time = %s AND status != 'cancelled'
        """,
        (doctor_id, appointment_date, start_time),
    )
    booked = c.fetchone()
    logger.debug(f"Booking conflict query: result={booked}, type={type(booked)}")
    if booked:
        conn.close()
        raise ValueError("Slot already booked")

    # Fetch patient's username and email
    c.execute(
        "SELECT username, email FROM users WHERE id = %s",
        (user_id,),
    )
    user = c.fetchone()
    logger.debug(f"User query: result={user}, type={type(user)}")
    if not user:
        conn.close()
        raise ValueError("User not found")
    if not isinstance(user, tuple):
        conn.close()
        raise ValueError(f"Invalid user query result type: {type(user)}")
    patient_username, patient_email = user

    # Insert appointment
    appointment_id = str(uuid.uuid4())
    created_at = datetime.utcnow()  # Use TIMESTAMP directly
    try:
        c.execute(
            """
            INSERT INTO appointments (
                id, user_id, doctor_id, department_id, hospital_id, appointment_date,
                start_time, end_time, status, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                appointment_id,
                user_id,
                doctor_id,
                department_id,
                hospital_id,
                appointment_date,
                start_time,
                end_time,
                "scheduled",
                created_at,
            ),
        )
        conn.commit()
    except psycopg2.IntegrityError as e:
        conn.rollback()
        logger.error(f"Failed to insert appointment: {str(e)}")
        conn.close()
        raise ValueError("Error booking appointment")

    conn.close()

    # Send confirmation email in the background
    if patient_email:
        logger.debug(f"Scheduling confirmation email to {patient_email}")
        asyncio.create_task(
            async_send_confirmation_email(
                recipient_email=patient_email,
                patient_username=patient_username,
                doctor_username=doctor_username,
                department_name=department_name,
                appointment_date=appointment_date,
                start_time=start_time,
                hospital_id=hospital_id,
            )
        )

    booking = {
        "id": appointment_id,
        "user_id": user_id,
        "username": patient_username,
        "doctor_id": doctor_id,
        "doctor_username": doctor_username,
        "department_id": department_id,
        "department_name": department_name,
        "appointment_date": appointment_date,
        "start_time": start_time,
        "end_time": end_time,
        "status": "scheduled",
        "created_at": str(created_at),
        "hospital_id": hospital_id,
    }
    logger.info(f"Booking successful: {booking}")
    return booking


def rag_query(query: str, user_id: str) -> str:
    history = get_general_chat_history(user_id)
    history_text = "".join(
        [
            f"User: {entry['query']}\nAssistant: {entry['response']}\n\n"
            for entry in history
        ]
    )
    response = retrieval_chain.invoke({"input": query, "history": history_text})
    answer = response.get("answer", "No answer found.")
    store_general_chat_history(user_id, query, answer)
    return answer


def get_department_id_by_name(department_name: str) -> Optional[str]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "SELECT id FROM departments WHERE LOWER(name) = LOWER(%s)", (department_name,)
    )
    result = c.fetchone()
    conn.close()
    return result[0] if result else None


def get_all_department_names() -> List[str]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name FROM departments")
    departments = [row[0] for row in c.fetchall()]
    conn.close()
    return departments


def get_hospital_id_by_department(department_id: str) -> Optional[str]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT hospital_id FROM departments WHERE id = %s", (department_id,))
    result = c.fetchone()
    conn.close()
    return result[0] if result else None


def get_doctor_id_by_username(username: str) -> Optional[str]:
    logger.debug(
        f"get_doctor_id_by_username called with username={username}, type={type(username)}"
    )
    if not isinstance(username, str):
        logger.error(f"Expected string username, got {type(username)}: {username}")
        raise ValueError(f"Invalid username type: {type(username)}")

    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        "SELECT id FROM users WHERE username = %s AND role = 'doctor'", (username,)
    )
    result = c.fetchone()
    logger.debug(
        f"get_doctor_id_by_username: username={username}, result={result}, type={type(result)}"
    )

    if result and not isinstance(result, tuple):
        logger.error(f"Expected tuple from fetchone, got {type(result)}: {result}")
        conn.close()
        raise ValueError(f"Invalid query result type: {type(result)}")

    doctor_id = result[0] if result else None
    logger.debug(
        f"get_doctor_id_by_username returning doctor_id={doctor_id}, type={type(doctor_id)}"
    )
    conn.close()

    if doctor_id and not isinstance(doctor_id, str):
        logger.error(f"Expected string doctor_id, got {type(doctor_id)}: {doctor_id}")
        raise ValueError(f"Invalid doctor_id type: {type(doctor_id)}")

    return doctor_id


def database_knowledge_agent(condition: str) -> DatabaseKnowledgeResponse:
    departments = get_all_department_names()

    prompt = ChatPromptTemplate.from_template(
        """
        You are a database knowledge agent. Your task is to infer the most appropriate medical department for a given condition based on your medical knowledge and return a JSON object with the department name.

        **Available Departments:** {departments}

        **Condition:** {condition}

        **Instructions:**
        - Analyze the condition and select the most relevant department from the available departments.
        - If no department matches, set "department_name" to null.
        - Return a JSON object with a single field: "department_name".
        - Output ONLY valid JSON, enclosed in curly braces {{}}, with double-quoted keys and values.
        - Do NOT wrap the JSON in markdown code blocks or include any other text.

        **Examples:**
        - Condition: "acne" → {{"department_name": "Department of Dermatology"}}
        - Condition: "cancer" → {{"department_name": "Oncology"}}
        - Condition: "fatigue" → {{"department_name": null}}
        - Condition: "psoriasis" → {{"department_name": "Department of Dermatology"}}

        **Output (valid JSON only, no markdown):**
        """
    )
    try:
        response = llm.invoke(
            prompt.format(condition=condition, departments=", ".join(departments))
        )
        logger.debug(f"DatabaseKnowledgeAgent LLM raw response: {response.content}")
        cleaned_response = re.sub(r"```json\s*|\s*```", "", response.content).strip()
        result = json.loads(cleaned_response)
        department_name = result.get("department_name")
    except json.JSONDecodeError as e:
        logger.error(
            f"DatabaseKnowledgeAgent failed to parse LLM response: {cleaned_response}, error: {e}"
        )
        department_name = None
    except Exception as e:
        logger.error(
            f"DatabaseKnowledgeAgent error: {e}, LLM response: {cleaned_response}"
        )
        department_name = None

    if not department_name:
        return DatabaseKnowledgeResponse(
            department_name=None,
            department_id=None,
            doctors=[],
            error=(
                f"Could not determine department for condition '{condition}'. "
                f"Available departments: {', '.join(departments)}."
            ),
        )

    department_id = get_department_id_by_name(department_name)
    if not department_id:
        return DatabaseKnowledgeResponse(
            department_name=department_name,
            department_id=None,
            doctors=[],
            error=(
                f"No department found for '{department_name}'. "
                f"Available departments: {', '.join(departments)}."
            ),
        )

    doctors = get_doctors(department_id=department_id)
    if not doctors:
        return DatabaseKnowledgeResponse(
            department_name=department_name,
            department_id=department_id,
            doctors=[],
            error=f"No doctors found in the {department_name} department.",
        )

    for doctor in doctors:
        availability = get_doctor_availability(doctor["user_id"])
        doctor["availability"] = availability

    return DatabaseKnowledgeResponse(
        department_name=department_name,
        department_id=department_id,
        doctors=doctors,
        error=None,
    )


TOOLS = [
    Tool(
        name="get_hospitals",
        description="Retrieve a list of hospitals with their details.",
        function=get_hospitals,
    ),
    Tool(
        name="get_doctors",
        description="Retrieve a list of doctors, optionally filtered by department or hospital.",
        function=get_doctors,
    ),
    Tool(
        name="get_doctor_availability",
        description="Retrieve a doctor's availability, optionally for a specific date.",
        function=get_doctor_availability,
    ),
    Tool(
        name="book_appointment",
        description="Book an appointment with a doctor.",
        function=book_appointment,
    ),
    Tool(
        name="rag_query",
        description="Query the RAG system for general medical information.",
        function=rag_query,
    ),
]


def router_agent(query: str, user_id: str) -> RouterResponse:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute("SELECT name FROM departments")
    departments = [row[0] for row in c.fetchall()]
    conn.close()

    prompt = ChatPromptTemplate.from_template(
        """
        You are an intelligent router agent. Your task is to analyze the user's query and return a JSON object specifying whether it should be handled by the RAG system (general medical questions) or the database (hospitals, doctors, appointments).

        **Available Departments:** {departments}

        **Query:** {query}

        **Instructions:**
        - Return a JSON object with exactly two fields: "action" and "parameters".
        - Set "action" to "rag_query" for general medical questions (e.g., about diseases, symptoms, treatments).
        - Set "action" to "db_query" for queries about hospitals, doctors, availability, or appointments.
        - For "parameters":
          - If "action" is "rag_query", include "query" with the original query.
          - If "action" is "db_query", include "tool" (e.g., "get_hospitals", "get_doctors", "book_appointment").
          - For "get_doctors", include "condition" and "department_name" if a condition is mentioned (e.g., "acne" → "Department of Dermatology").
          - For "book_appointment", extract:
            - "doctor_username" (e.g., "doctorderma"),
            - "appointment_date" (e.g., "2025-05-05"),
            - "start_time" (e.g., "09:00"),
            - "end_time" (e.g., "09:30").
            - If any booking details are missing, set them to null.
          - If a condition is mentioned without booking details, infer "department_name" from available departments.
          - If no department can be inferred, set "department_name" to null.
        - Output ONLY valid JSON, enclosed in curly braces {{}}, with double-quoted keys and values.
        - Do NOT wrap the JSON in markdown code blocks or include any other text.

        **Examples:**
        - Query: "What is acne?" → {{"action": "rag_query", "parameters": {{"query": "What is acne?"}}}}
        - Query: "List hospitals" → {{"action": "db_query", "parameters": {{"tool": "get_hospitals"}}}}
        - Query: "List available doctors for acne?" → {{"action": "db_query", "parameters": {{"tool": "get_doctors", "condition": "acne", "department_name": "Department of Dermatology"}}}}
        - Query: "Book appointment with doctorderma on Monday, 2025-05-05 from 09:00 to 09:30" → {{"action": "db_query", "parameters": {{"tool": "book_appointment", "doctor_username": "doctorderma", "appointment_date": "2025-05-05", "start_time": "09:00", "end_time": "09:30"}}}}
        - Query: "Book my slot for Monday: 09:00 - 09:30" → {{"action": "db_query", "parameters": {{"tool": "book_appointment", "doctor_username": null, "appointment_date": null, "start_time": "09:00", "end_time": "09:30"}}}}
        - Query: "List doctors for fatigue" → {{"action": "db_query", "parameters": {{"tool": "get_doctors", "condition": "fatigue", "department_name": null}}}}

        **Output (valid JSON only, no markdown):**
        """
    )
    try:
        response = llm.invoke(
            prompt.format(query=query, departments=", ".join(departments))
        )
        logger.debug(f"RouterAgent LLM raw response: {response.content}")
        cleaned_response = re.sub(r"```json\s*|\s*```", "", response.content).strip()
        result = json.loads(cleaned_response)
        return RouterResponse(**result)
    except json.JSONDecodeError as e:
        logger.error(
            f"RouterAgent failed to parse LLM response: {cleaned_response}, error: {e}"
        )
        return RouterResponse(action="rag_query", parameters={"query": query})
    except Exception as e:
        logger.error(f"RouterAgent error: {e}, LLM response: {cleaned_response}")
        return RouterResponse(action="rag_query", parameters={"query": query})


async def appointment_booking_agent(query: str, user_id: str) -> Dict:
    try:
        logger.debug(
            f"appointment_booking_agent called with query={query}, user_id={user_id}, "
            f"type(query)={type(query)}, type(user_id)={type(user_id)}"
        )

        # Validate inputs
        if not isinstance(query, str):
            logger.error(f"Expected string query, got {type(query)}: {query}")
            return {"response": f"Internal error: Invalid query type: {type(query)}"}
        if not isinstance(user_id, str):
            logger.error(f"Expected string user_id, got {type(user_id)}: {user_id}")
            return {
                "response": f"Internal error: Invalid user_id type: {type(user_id)}"
            }

        routing = router_agent(query, user_id)
        logger.info(f"Routing decision: {routing}, type={type(routing)}")
        logger.debug(
            f"Routing parameters: {routing.parameters}, type={type(routing.parameters)}"
        )

        # Validate routing
        if not isinstance(routing, RouterResponse):
            logger.error(f"Expected RouterResponse, got {type(routing)}: {routing}")
            return {
                "response": f"Internal error: Invalid routing type: {type(routing)}"
            }
        if not isinstance(routing.parameters, dict):
            logger.error(
                f"Expected dict for routing.parameters, got {type(routing.parameters)}: {routing.parameters}"
            )
            return {
                "response": f"Internal error: Invalid parameters type: {type(routing.parameters)}"
            }

        if routing.action == "rag_query":
            result = rag_query(routing.parameters.get("query", query), user_id)
            logger.info(f"RAG query result: {result[:100]}...")
            return {"response": result}

        elif routing.action == "db_query":
            tool_name = routing.parameters.get("tool")
            condition = routing.parameters.get("condition")
            department_name = routing.parameters.get("department_name")
            logger.debug(
                f"DB query: tool={tool_name}, condition={condition}, department={department_name}, "
                f"types: tool={type(tool_name)}, condition={type(condition)}, dept={type(department_name)}"
            )

            if not isinstance(tool_name, str):
                logger.error(
                    f"Expected string tool_name, got {type(tool_name)}: {tool_name}"
                )
                return {
                    "response": f"Internal error: Invalid tool_name type: {type(tool_name)}"
                }

            if tool_name == "get_doctors" and condition:
                db_response = database_knowledge_agent(condition)
                if db_response.error:
                    return {"response": db_response.error}
                return {"response": db_response.doctors}

            if tool_name == "book_appointment":
                doctor_username = routing.parameters.get("doctor_username")
                appointment_date = routing.parameters.get("appointment_date")
                start_time = routing.parameters.get("start_time")
                end_time = routing.parameters.get("end_time")
                logger.debug(
                    f"Booking params: username={doctor_username}, date={appointment_date}, "
                    f"start={start_time}, end={end_time}, "
                    f"types: username={type(doctor_username)}, date={type(appointment_date)}, "
                    f"start={type(start_time)}, end={type(end_time)}"
                )

                # Validate booking parameters
                if not all([doctor_username, appointment_date, start_time, end_time]):
                    return {
                        "response": "Booking requires doctor username, date, start time, and end time. Please provide all details."
                    }
                if not all(
                    isinstance(x, str)
                    for x in [doctor_username, appointment_date, start_time, end_time]
                ):
                    logger.error(
                        f"Invalid booking param types: username={type(doctor_username)}, "
                        f"date={type(appointment_date)}, start={type(start_time)}, end={type(end_time)}"
                    )
                    return {
                        "response": "Internal error: Invalid booking parameter types."
                    }

                # Get doctor ID
                doctor_id = get_doctor_id_by_username(doctor_username)
                logger.debug(f"Doctor ID: {doctor_id}, type={type(doctor_id)}")
                if not doctor_id:
                    return {
                        "response": f"No doctor found with username '{doctor_username}'."
                    }
                if not isinstance(doctor_id, str):
                    logger.error(
                        f"Expected string doctor_id, got {type(doctor_id)}: {doctor_id}"
                    )
                    return {
                        "response": f"Internal error: Invalid doctor_id type: {type(doctor_id)}"
                    }

                # Get department and hospital IDs
                conn = get_db_connection()
                c = conn.cursor()

                # Fetch department_id from doctors table
                c.execute(
                    """
                    SELECT department_id
                    FROM doctors
                    WHERE user_id = %s
                    """,
                    (doctor_id,),
                )
                department_result = c.fetchone()
                logger.debug(
                    f"Department query: doctor_id={doctor_id}, result={department_result}, type={type(department_result)}"
                )
                if not department_result:
                    conn.close()
                    return {
                        "response": f"No department found for doctor '{doctor_username}'."
                    }
                if not isinstance(department_result, tuple):
                    conn.close()
                    logger.error(
                        f"Expected tuple for department_result, got {type(department_result)}: {department_result}"
                    )
                    return {
                        "response": f"Internal error: Invalid department query result type: {type(department_result)}"
                    }
                department_id = department_result[0]
                logger.debug(
                    f"Department ID: {department_id}, type={type(department_id)}"
                )

                # Fetch hospital_id from departments table
                c.execute(
                    """
                    SELECT hospital_id
                    FROM departments
                    WHERE id = %s
                    """,
                    (department_id,),
                )
                hospital_result = c.fetchone()
                logger.debug(
                    f"Hospital query: department_id={department_id}, result={hospital_result}, type={type(hospital_result)}"
                )
                conn.close()
                if not hospital_result:
                    return {
                        "response": f"No hospital found for department ID '{department_id}'."
                    }
                if not isinstance(hospital_result, tuple):
                    logger.error(
                        f"Expected tuple for hospital_result, got {type(hospital_result)}: {hospital_result}"
                    )
                    return {
                        "response": f"Internal error: Invalid hospital query result type: {type(hospital_result)}"
                    }
                hospital_id = hospital_result[0]
                logger.debug(f"Hospital ID: {hospital_id}, type={type(hospital_id)}")

                # Validate IDs
                if not all(isinstance(x, str) for x in [department_id, hospital_id]):
                    logger.error(
                        f"Invalid ID types: department_id={type(department_id)}, hospital_id={type(hospital_id)}"
                    )
                    return {
                        "response": f"Internal error: Invalid department or hospital ID type."
                    }

                # Book appointment
                try:
                    logger.debug(
                        f"Calling book_appointment with: user_id={user_id}, doctor_id={doctor_id}, "
                        f"department_id={department_id}, hospital_id={hospital_id}, "
                        f"appointment_date={appointment_date}, start_time={start_time}, "
                        f"end_time={end_time}"
                    )
                    booking = book_appointment(
                        user_id=user_id,
                        doctor_id=doctor_id,
                        department_id=department_id,
                        hospital_id=hospital_id,
                        appointment_date=appointment_date,
                        start_time=start_time,
                        end_time=end_time,
                    )
                    logger.debug(f"Booking successful: {booking}")
                    return {"response": booking}
                except ValueError as e:
                    logger.debug(f"Booking failed: {str(e)}")
                    return {"response": str(e)}

            department_id = None
            if department_name and not condition:
                department_id = get_department_id_by_name(department_name)
                if not department_id:
                    available_departments = get_all_department_names()
                    return {
                        "response": (
                            f"No department found for {department_name}. "
                            f"Please try again with a valid department. Available departments: {', '.join(available_departments)}."
                        )
                    }

            for tool in TOOLS:
                if tool.name == tool_name:
                    if tool_name == "get_doctors" and department_id:
                        doctors = tool.function(department_id=department_id)
                        if not doctors:
                            return {
                                "response": f"No doctors found in the {department_name} department."
                            }
                        for doctor in doctors:
                            availability = get_doctor_availability(doctor["user_id"])
                            doctor["availability"] = availability
                        return {"response": doctors}
                    elif tool_name == "get_doctor_availability":
                        result = tool.function(**routing.parameters.get("params", {}))
                        return {"response": result}
                    else:
                        result = tool.function(**routing.parameters.get("params", {}))
                        return {"response": result}

            return {"response": f"Tool {tool_name} not found."}

        else:
            return {"response": "Invalid routing action."}

    except Exception as e:
        logger.error(f"Error in appointment_booking_agent: {str(e)}", exc_info=True)
        return {"response": f"Error processing query: {str(e)}"}
