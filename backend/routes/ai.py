from fastapi import APIRouter, Depends, HTTPException, Body, Path
from models.schemas import *
from routes.auth import get_current_user, require_role
from config.settings import settings
import logging
from passlib.context import CryptContext
from utils.agents import appointment_booking_agent
import requests
from starlette.exceptions import HTTPException as StarletteHTTPException
import os
import asyncio
import re
from utils.parser import *
from openai import OpenAI
from fastapi import (
    HTTPException,
    Depends,
    UploadFile,
    File,
    Form,
    Request,
)
import json
from utils.agents import *
import base64
import numpy as np
from PIL import Image
from tensorflow.keras.models import load_model
import tensorflow as tf
import gc
from config.settings import settings
from utils.ai_utils import *
from utils.ai_utils import predict_breast_cancer_image, generate_groq_response
from utils.prompts import *
import re

# Validate OpenAI API key
if not settings.OPENAI_API_KEY:
    raise ValueError("OpenAI API key is not set in environment variables")

router = APIRouter()
logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@router.post("/chatbot")
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


@router.get("/api/emergency/hospitals", response_model=dict)
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


@router.post("/api/medical-query")
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
            Analyze the blood test results and answer questions using these guidelines:
            1. Keep answers concise (100-150 words) and easy to understand.
            2. Use simple analogies to explain medical concepts.
            3. Break down medical terms into plain language.
            4. If values are abnormal:
               - Explain what they mean
               - Discuss possible causes
               - Suggest reasonable next steps
            5. For concerning values, indicate urgency level (routine/moderate/immediate attention).
            6. Always remind that this is for informational purposes, not a diagnosis.
            7. Format in clear sections:
               - Summary of findings
               - Explanation of key values
               - Recommendations

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
        # Call OpenAI API
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert medical professional specialized in analyzing blood test results and explaining them in simple terms.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            model="gpt-4o-mini",  # Using GPT-4 for medical analysis
            temperature=0.3,  # Lower temperature for more factual responses
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


@router.post("/api/acne-analysis")
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


@router.post("/api/general-query")
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


@router.post("/api/disease-followup")
async def disease_followup(
    request: dict = Body(...), current_user: dict = Depends(get_current_user)
):
    """Handle follow-up questions after disease detection and refer to a doctor if needed."""
    question = request.get("question", "")
    context = request.get("context", "")
    if not question.strip():
        raise HTTPException(status_code=400, detail="A non-empty question is required.")

    # Use the agent to answer the follow-up question
    agent_response = await appointment_booking_agent(question, current_user["user_id"])
    answer = agent_response.get("response", "Sorry, I couldn't process your question.")

    referral = None
    # If answer is a list (doctors), treat as referral
    if isinstance(answer, list) and answer:
        doctor = answer[0]
        referral = {
            "name": doctor.get("username", "Doctor"),
            "specialty": doctor.get("specialty", "Doctor"),
            "contact": doctor.get("email", "N/A"),
        }
        answer_text = f"I recommend you consult {referral['name']} ({referral['specialty']}). Contact: {referral['contact']}"
    elif isinstance(answer, str):
        answer_text = answer
        if any(
            word in answer.lower()
            for word in [
                "see a doctor",
                "consult a doctor",
                "refer",
                "urgent",
                "specialist",
            ]
        ):
            from utils.agents import database_knowledge_agent

            department_info = database_knowledge_agent(context or question)
            doctor = department_info.doctors[0] if department_info.doctors else None
            if doctor:
                referral = {
                    "name": doctor["username"],
                    "specialty": doctor.get("specialty", "Doctor"),
                    "contact": doctor.get("email", "N/A"),
                }
            else:
                referral = {
                    "name": "Doctor (to be assigned)",
                    "specialty": department_info.department_name or "General Medicine",
                    "contact": "N/A",
                }
        answer_text = answer
    else:
        answer_text = str(answer)
    return {"response": answer_text, "referral": referral}


@router.post("/api/kidney-disease-image-classification")
async def kidney_disease_image_classification(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Classify kidney disease from an uploaded image using a Keras model."""
    try:
        if image.content_type not in ["image/jpeg", "image/png"]:
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(
                status_code=400, detail="Only JPEG or PNG images are supported."
            )
        image_data = await image.read()
        from io import BytesIO

        image_file = BytesIO(image_data)
        result = predict_kidney_image(image_file)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error in kidney disease image classification: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error in kidney disease image classification: {e}"
        )


@router.post("/api/breast-cancer-image-classification")
async def breast_cancer_image_classification(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Classify breast cancer from an uploaded image using a Keras model."""
    try:
        if image.content_type not in ["image/jpeg", "image/png"]:
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(
                status_code=400, detail="Only JPEG or PNG images are supported."
            )
        image_data = await image.read()
        from io import BytesIO

        image_file = BytesIO(image_data)
        result = predict_breast_cancer_image(image_file)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error in breast cancer image classification: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error in breast cancer image classification: {e}"
        )


@router.post("/api/lymphoma-image-classification")
async def lymphoma_image_classification(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Classify lymphoma from an uploaded image using a Keras model."""
    try:
        if image.content_type not in ["image/jpeg", "image/png"]:
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(
                status_code=400, detail="Only JPEG or PNG images are supported."
            )
        image_data = await image.read()
        from io import BytesIO

        image_file = BytesIO(image_data)
        result = predict_lymphoma(image_file)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error in lymphoma image classification: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error in lymphoma image classification: {e}"
        )


@router.post("/api/pneumonia-image-classification")
async def pneumonia_image_classification(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Classify pneumonia from an uploaded image using a Keras model."""
    try:
        if image.content_type not in ["image/jpeg", "image/png"]:
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(
                status_code=400, detail="Only JPEG or PNG images are supported."
            )
        image_data = await image.read()
        from io import BytesIO

        image_file = BytesIO(image_data)
        result = predict_pneumonia(image_file)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error in pneumonia image classification: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error in pneumonia image classification: {e}"
        )


@router.post("/api/eye-disease-image-classification")
async def eye_disease_image_classification(
    image: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Classify eye disease from an uploaded image using a Keras model."""
    try:
        if image.content_type not in ["image/jpeg", "image/png"]:
            logger.error(f"Invalid file type: {image.content_type}")
            raise HTTPException(
                status_code=400, detail="Only JPEG or PNG images are supported."
            )
        image_data = await image.read()
        from io import BytesIO

        image_file = BytesIO(image_data)
        result = predict_eye_disease(image_file)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        logger.error(f"Error in eye disease image classification: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error in eye disease image classification: {e}"
        )


@router.post("/api/eye-disease-chat", response_model=EyeDiseaseChatResponse)
async def eye_disease_chat(
    request: EyeDiseaseChatRequest, current_user: dict = Depends(get_current_user)
):
    """
    Chatbot endpoint for eye disease questions using Gemini.
    """
    try:
        logger.info(f"Received eye disease chat message: {request.message[:50]}...")
        assistant_response = await generate_groq_response(
            request.message, system_prompt=EYE_DISEASE_PROMPT
        )
        return EyeDiseaseChatResponse(response=assistant_response)
    except Exception as e:
        logger.error(f"Error generating eye disease chat response: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating response: {str(e)}"
        )


@router.post("/api/lymphoma-chat", response_model=EyeDiseaseChatResponse)
async def lymphoma_chat(
    request: EyeDiseaseChatRequest, current_user: dict = Depends(get_current_user)
):
    """
    Chatbot endpoint for lymphoma questions using Gemini.
    """
    try:
        logger.info(f"Received lymphoma chat message: {request.message[:50]}...")
        assistant_response = await generate_groq_response(
            request.message, system_prompt=LYMPHOMA_DISEASE_PROMPT
        )
        return EyeDiseaseChatResponse(response=assistant_response)
    except Exception as e:
        logger.error(f"Error generating lymphoma chat response: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating response: {str(e)}"
        )


@router.post("/api/pneumonia-chat", response_model=EyeDiseaseChatResponse)
async def pneumonia_chat(
    request: EyeDiseaseChatRequest, current_user: dict = Depends(get_current_user)
):
    """
    Chatbot endpoint for pneumonia questions using Gemini.
    """
    try:
        logger.info(f"Received pneumonia chat message: {request.message[:50]}...")
        assistant_response = await generate_groq_response(
            request.message, system_prompt=PNEUMONIA_PROMPT
        )
        return EyeDiseaseChatResponse(response=assistant_response)
    except Exception as e:
        logger.error(f"Error generating pneumonia chat response: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating response: {str(e)}"
        )


@router.post("/api/breast-cancer-chat", response_model=EyeDiseaseChatResponse)
async def breast_cancer_chat(
    request: EyeDiseaseChatRequest, current_user: dict = Depends(get_current_user)
):
    """
    Chatbot endpoint for breast cancer questions using Gemini.
    """
    try:
        logger.info(f"Received breast cancer chat message: {request.message[:50]}...")
        assistant_response = await generate_groq_response(
            request.message, system_prompt=BREAST_CANCER_PROMPT
        )
        return EyeDiseaseChatResponse(response=assistant_response)
    except Exception as e:
        logger.error(f"Error generating breast cancer chat response: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating response: {str(e)}"
        )


@router.post("/api/kidney-disease-chat", response_model=EyeDiseaseChatResponse)
async def kidney_disease_chat(
    request: EyeDiseaseChatRequest, current_user: dict = Depends(get_current_user)
):
    """
    Chatbot endpoint for kidney disease questions using Gemini.
    """
    try:
        logger.info(f"Received kidney disease chat message: {request.message[:50]}...")
        assistant_response = await generate_groq_response(
            request.message, system_prompt=KIDNEY_DISEASE_PROMPT
        )
        return EyeDiseaseChatResponse(response=assistant_response)
    except Exception as e:
        logger.error(f"Error generating kidney disease chat response: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating response: {str(e)}"
        )
