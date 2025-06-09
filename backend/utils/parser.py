import os
import json
import re
import logging
from llama_cloud_services import LlamaParse
from groq import Groq
from dotenv import load_dotenv
from fastapi import HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
from config.settings import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Initialize LlamaParse and Groq
LLAMA_PARSER_API_KEY = os.getenv("LLAMA_PARSER_API_KEY")

parser = LlamaParse(api_key=LLAMA_PARSER_API_KEY, result_type="markdown")
client = Groq(api_key=settings.GROQ_API_KEY)

# In-memory conversation history: {user_id: [{"query": str, "report_json": str, "response": str, "timestamp": datetime}, ...]}
conversation_history = defaultdict(list)
HISTORY_LIMIT = 5  # Max 5 entries per user
HISTORY_TIMEOUT = timedelta(hours=1)  # Clear entries older than 1 hour


def prune_history(user_id: str):
    """Remove old entries from conversation history."""
    now = datetime.utcnow()
    conversation_history[user_id] = [
        entry
        for entry in conversation_history[user_id]
        if now - entry["timestamp"] < HISTORY_TIMEOUT
    ][:HISTORY_LIMIT]
    logger.info(
        f"Pruned history for user {user_id}: {len(conversation_history[user_id])} entries remain"
    )


def store_chat_history(user_id: str, query: str, report_json: str, response: str):
    """Store conversation in memory."""
    prune_history(user_id)
    conversation_history[user_id].append(
        {
            "query": query,
            "report_json": report_json,
            "response": response,
            "timestamp": datetime.utcnow(),
        }
    )
    conversation_history[user_id] = conversation_history[user_id][-HISTORY_LIMIT:]
    logger.info(
        f"Stored chat history for user {user_id}: query='{query}', response='{response[:50]}...'"
    )


def get_chat_history(user_id: str):
    """Retrieve recent chat history for context."""
    prune_history(user_id)
    history = conversation_history[user_id]
    logger.info(f"Retrieved history for user {user_id}: {len(history)} entries")
    return history


async def parse_blood_report(file_path: str):
    """Parse PDF blood report using LlamaParse async method."""
    try:
        logger.info(f"Parsing PDF: {file_path}")
        documents = await parser.aload_data(file_path)
        if not documents or not documents[0].text:
            raise ValueError("No text extracted from PDF")
        logger.info(f"PDF parsed successfully: {file_path}")
        return documents[0].text
    except Exception as e:
        logger.error(f"Failed to parse PDF {file_path}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")


async def structure_report(report_text: str):
    """Structure report into JSON using Groq."""
    logger.info("Structuring report")
    age_match = re.search(r"Age:\s*([\d\sYMWD]+)", report_text)
    gender_match = re.search(r"Gender:\s*(Male|Female)", report_text)
    patient_age = age_match.group(1).strip() if age_match else "Unknown"
    patient_gender = gender_match.group(1).strip() if gender_match else "Unknown"

    generation_chat_history = [
        {
            "role": "system",
            "content": "You are an expert data parser tasked with generating high-quality, structured JSON output. "
            "Your task is to parse the provided patient report data and output *only* valid JSON (enclosed in ```json ... ```) "
            "with no additional text or explanations.",
        },
        {
            "role": "user",
            "content": f"""
Please parse the provided patient report data and format the output in a structured JSON format. The JSON must be enclosed in ```json ... ``` and include only the JSON object, with no additional text. The JSON should have the following sections with exact key names:

1. **patient_info**: Include:
   - **age**: The patient's age (e.g., "3 Y 0 M 0 D" or "Unknown").
   - **gender**: The patient's gender (e.g., "Male", "Female", or "Unknown").
2. **haematology_results**: Include all test results from the HAEMATOLOGY section, with each test containing:
   - **test**: The name of the test (e.g., "WBC Count").
   - **patient_value**: The patient's test result (e.g., "12580").
   - **unit**: The unit of measurement (e.g., "μL").
   - **reference_value**: The reference range specific to the patient's age and gender (e.g., for a {patient_age} {patient_gender}, use ranges like "Child 2 Mon- 6 Yrs: 5,000-15,000" where applicable).
   - **remark**: Indicate whether the patient value is "Normal", "Low", or "High" based on the reference_value.

Exclude empty entries and non-test data. Ensure the JSON is well-structured. Here is the patient report data:

{report_text}
""",
        },
    ]

    logger.info("Sending structure request to Groq")
    response = (
        client.chat.completions.create(
            messages=generation_chat_history, model="llama3-70b-8192"
        )
        .choices[0]
        .message.content
    )
    logger.info(f"Received structure response: {response[:100]}...")

    json_match = re.search(r"```json\s*(.*?)\s*```", response, re.DOTALL)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = response

    try:
        json_output = json.loads(json_str)
        logger.info("Structured report JSON parsed successfully")
        return json_output, generation_chat_history + [
            {"role": "assistant", "content": response}
        ]
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON response from Groq: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Invalid JSON response from Groq: {str(e)}"
        )


async def interpret_report(json_output: dict, user_query: str, user_id: str):
    """Generate initial interpretation of blood report using Groq."""
    patient_age = json_output.get("patient_info", {}).get("age", "Unknown")
    patient_gender = json_output.get("patient_info", {}).get("gender", "Unknown")
    history = get_chat_history(user_id)

    interpretation_chat_history = [
        {
            "role": "system",
            "content": """
You are a friendly medical AI assistant who explains blood test results in simple, kind words for people who don’t know medical terms. Your task is to provide an initial interpretation of the blood test results based on the user’s query (e.g., “Why am I tired?” or “Explain my results”). Follow these guidelines:

1. **Explain Results**: Summarize key findings (e.g., low Haemoglobin) relevant to the query, using the blood test results.
2. **Keep It Simple**: Use analogies (e.g., “Red blood cells are like trucks carrying oxygen”) and avoid medical jargon.
3. **Tailor to Patient**: Use the patient’s age and gender to make the response relevant.
4. **Be Concise**: Keep answers 100-150 words, clear, and focused on the query.
5. **Actionable Advice**: Suggest 1-2 next steps (e.g., “Talk to your doctor about iron supplements”).
6. **Urgency**: Highlight when to see a doctor urgently (e.g., “If you feel dizzy, go now”).
7. **Output**: Provide *only* plain text with no JSON or code blocks.

### Input Data
- **Blood Test Results**: JSON with patient_info (age, gender) and haematology_results (test name, patient_value, unit, reference_value, remark).
- **Current Query**: The user’s question (e.g., “Why am I tired?”).
""",
        },
        {
            "role": "user",
            "content": f"""
Patient Age: {patient_age}
Patient Gender: {patient_gender}
Current Query: {user_query}
Blood Test Results (JSON):
{json.dumps(json_output, indent=2)}
""",
        },
    ]

    logger.info(
        f"Sending initial interpretation request for user {user_id}, query: {user_query}"
    )
    logger.debug(
        f"Interpretation prompt: {json.dumps(interpretation_chat_history, indent=2)}"
    )

    response = (
        client.chat.completions.create(
            messages=interpretation_chat_history,
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=300,
        )
        .choices[0]
        .message.content
    )
    logger.info(f"Initial interpretation response: {response[:100]}...")

    # Store in chat history
    store_chat_history(user_id, user_query, json.dumps(json_output), response)
    return response, interpretation_chat_history + [
        {"role": "assistant", "content": response}
    ]


async def answer_followup_query(json_output: dict, user_query: str, user_id: str):
    """Answer follow-up questions using prior report interpretation as context."""
    patient_age = json_output.get("patient_info", {}).get("age", "Unknown")
    patient_gender = json_output.get("patient_info", {}).get("gender", "Unknown")
    history = get_chat_history(user_id)

    # Find the most recent relevant history entry
    prior_response = None
    prior_query = None
    for entry in reversed(history[:3]):  # Check last 3 entries
        if entry["response"]:
            prior_query = entry["query"]
            prior_response = entry["response"]
            break

    if not prior_response:
        logger.warning(
            f"No prior response found for user {user_id}, treating as initial query"
        )
        return await interpret_report(json_output, user_query, user_id)

    followup_chat_history = [
        {
            "role": "system",
            "content": """
You are a friendly medical AI assistant who answers follow-up questions about blood test results in simple, kind words for non-experts. Your task is to answer the user’s current query using the prior interpretation and blood test results as context. Follow these guidelines:

1. **Focus on the Query**: Answer the user’s question directly (e.g., “What should I do next?” or “Do you recommend any precautions?”). Do NOT repeat the full report analysis.
2. **Use Prior Context**: Reference the prior response to provide continuity (e.g., “As we discussed, your low Haemoglobin might cause tiredness, so…”).
3. **Keep It Simple**: Use analogies (e.g., “Red blood cells are like trucks carrying oxygen”) and avoid medical jargon.
4. **Tailor to Patient**: Use the patient’s age and gender to make the response relevant.
5. **Be Concise**: Keep answers 80-120 words, clear, and query-specific.
6. **Actionable Advice**:
   - For “What should I do next?”, suggest specific steps (e.g., “See your doctor for a ferritin test”).
   - For “precautions”, suggest lifestyle/monitoring tips (e.g., “Eat iron-rich foods, avoid tea with meals”).
7. **Urgency**: Highlight when to see a doctor urgently (e.g., “If you feel dizzy, go now”).
8. **Output**: Provide *only* plain text with no JSON or code blocks.

### Input Data
- **Prior Query and Response**: The most recent query and interpretation to provide context.
- **Blood Test Results**: JSON with patient_info (age, gender) and haematology_results, use only if needed.
- **Current Query**: The user’s follow-up question.
""",
        },
        {
            "role": "user",
            "content": f"""
Prior Query: {prior_query}
Prior Response: {prior_response}
Patient Age: {patient_age}
Patient Gender: {patient_gender}
Current Query: {user_query}
Blood Test Results (JSON, use only if needed):
{json.dumps(json_output, indent=2)}
""",
        },
    ]

    logger.info(
        f"Sending follow-up query request for user {user_id}, query: {user_query}"
    )
    logger.debug(f"Follow-up prompt: {json.dumps(followup_chat_history, indent=2)}")

    response = (
        client.chat.completions.create(
            messages=followup_chat_history,
            model="llama3-70b-8192",
            temperature=0.5,
            max_tokens=200,
        )
        .choices[0]
        .message.content
    )
    logger.info(f"Follow-up response: {response[:100]}...")

    # Store in chat history
    store_chat_history(user_id, user_query, json.dumps(json_output), response)
    return response, followup_chat_history + [
        {"role": "assistant", "content": response}
    ]


async def analyze_acne_image(image_url: str, user_id: str):
    """Analyze an acne-related image using Groq's vision model."""
    try:
        logger.info(f"Analyzing acne image for user {user_id}")
        acne_chat_history = [
            {
                "role": "system",
                "content": """
You are a friendly dermatology AI assistant who analyzes images of skin to provide insights about acne in simple, kind words for non-experts. Your task is to describe the acne visible in the image and provide basic advice. Follow these guidelines:

1. **Describe Acne**: Identify the type (e.g., pimples, blackheads), severity (mild, moderate, severe), and location (e.g., cheeks, forehead).
2. **Keep It Simple**: Use clear language (e.g., “The red bumps are inflamed pimples”) and avoid medical jargon.
3. **Be Concise**: Keep answers 80-120 words, focused on the image.
4. **Actionable Advice**: Suggest 1-2 next steps (e.g., “Use a gentle cleanser” or “See a dermatologist”).
5. **Urgency**: Highlight when to see a doctor (e.g., “If the acne is painful or spreading, consult a dermatologist”).
6. **Limitations**: Note that this is not a medical diagnosis and recommend professional advice.
7. **Output**: Provide *only* plain text with no JSON or code blocks.
""",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Please analyze this image for acne and provide insights.",
                    },
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            },
        ]

        response = (
            client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=acne_chat_history,
                temperature=0.7,
                max_tokens=200,
                stream=False,
            )
            .choices[0]
            .message.content
        )

        logger.info(f"Acne analysis response: {response[:100]}...")

        # Store in chat history (no report_json for images)
        store_chat_history(user_id, "Analyze acne image", "", response)
        return response
    except Exception as e:
        logger.error(f"Failed to analyze acne image: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to analyze acne image: {str(e)}"
        )
