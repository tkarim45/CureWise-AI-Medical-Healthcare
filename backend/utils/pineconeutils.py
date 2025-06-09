import pandas as pd
import os
import time
import gc
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from pinecone import Pinecone, ServerlessSpec
from langchain_pinecone import PineconeVectorStore
import logging
from config.settings import settings
from typing import List
import uuid
import psycopg2
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- RAG System Configuration ---
PATIENT_COL = "Patient"
DOCTOR_COL = "Doctor"
DESCRIPTION_COL = "Description"
PINECONE_INDEX_NAME = "medical-conversations-rag"
EMBEDDING_DIMENSION = 768
BATCH_SIZE = 1000
SUB_BATCH_SIZE = 100
TOTAL_ROWS = 200000
START_ROW = 0

# Set API keys (should be in environment variables or settings)
os.environ["GOOGLE_API_KEY"] = settings.GOOGLE_API_KEY  # Ensure this is set in settings
os.environ["PINECONE_API_KEY"] = (
    settings.PINECONE_API_KEY
)  # Ensure this is set in settings

# Initialize RAG components globally
embeddings_model = None
vector_store = None
retrieval_chain = None


def initialize_rag_system():
    global embeddings_model, vector_store, retrieval_chain
    try:
        logger.info("Initializing RAG system...")

        # Initialize Embedding Model
        embeddings_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        logger.info("Embedding model initialized.")

        # Initialize Pinecone
        pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
        index_names = pc.list_indexes().names()
        if PINECONE_INDEX_NAME not in index_names:
            logger.info(f"Creating Pinecone index '{PINECONE_INDEX_NAME}'...")
            pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=EMBEDDING_DIMENSION,
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )
            while not pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
                time.sleep(5)
            logger.info("Index created.")
        else:
            logger.info(f"Using existing index '{PINECONE_INDEX_NAME}'.")

        index = pc.Index(PINECONE_INDEX_NAME)
        logger.info(
            f"Connected to index. Initial vector count: {index.describe_index_stats().total_vector_count}"
        )

        # Load data into Pinecone if index is empty
        vector_store = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME, embedding=embeddings_model
        )

        # Initialize LLM and RAG Chain
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.3)
        logger.info("LLM initialized.")

        retriever = vector_store.as_retriever(
            search_type="similarity", search_kwargs={"k": 3}
        )
        prompt_template = ChatPromptTemplate.from_template(
            """
                **Note:** You are an AI assistant using only the provided context from a dataset of patient-doctor conversations. You are not a doctor. Do not provide medical advice beyond the context. If the context lacks information, say so. Use the conversation history to understand references (e.g., pronouns like 'it') if relevant.

                **Conversation History (Recent Queries and Answers):**
                {history}

                **Context (from dataset):**
                {context}

                **Question:**
                {input}

                **Answer (based only on context, using history for clarity if needed):**
                If the question is about hospitals, doctors, or appointments, respond: "Please use the appointment booking system for this query."
                Otherwise, provide an answer based on the context.
                """
        )
        document_chain = create_stuff_documents_chain(llm, prompt_template)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)
        logger.info("RAG chain created.")

    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {e}")
        raise Exception(f"RAG initialization failed: {e}")


# Initialize RAG system on startup
initialize_rag_system()


def get_db_connection():
    return psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )


# --- Chat History Storage for General Queries ---
def store_general_chat_history(user_id: str, query: str, response: str):
    """Store general query chat history in PostgreSQL."""
    conn = get_db_connection()
    c = conn.cursor()
    chat_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()
    c.execute(
        """
        INSERT INTO general_chat_history (id, user_id, query, response, created_at)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (chat_id, user_id, query, response, created_at),
    )
    conn.commit()
    conn.close()
    logger.info(f"Stored chat history for user {user_id}")


def get_general_chat_history(user_id: str) -> list:
    """Retrieve general query chat history for a user from PostgreSQL."""
    conn = get_db_connection()
    c = conn.cursor()
    c.execute(
        """
        SELECT query, response, created_at
        FROM general_chat_history
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 2
        """,
        (user_id,),
    )
    history = [
        {"query": row[0], "response": row[1], "created_at": row[2]}
        for row in c.fetchall()
    ]
    conn.close()
    logger.info(f"Retrieved chat history for user {user_id}")
    return history
