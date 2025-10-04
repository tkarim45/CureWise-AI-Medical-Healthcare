import pandas as pd
import os
import time
import gc
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
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
PINECONE_INDEX_NAME = "curewise-medical-rag"
EMBED_MODEL = "text-embedding-3-small"  # OpenAI embedding model
EMBEDDING_DIMENSION = 1536  # matches text-embedding-3-small

# Set API keys (ensure these are set in your settings/env)
os.environ["OPENAI_API_KEY"] = settings.OPENAI_API_KEY
os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY


# Function to get vector count
def get_vector_count(index):
    try:
        stats = index.describe_index_stats()
        count = stats["total_vector_count"]
        logger.info(f"Found {count} vectors in index stats")
        return count
    except Exception as e:
        logger.error(f"Error getting vector count: {str(e)}")
        return 0


# Initialize RAG components globally
embeddings_model = None
vector_store = None
retrieval_chain = None


def initialize_rag_system():
    global embeddings_model, vector_store, retrieval_chain
    try:
        logger.info("Initializing RAG system...")

        # ✅ Initialize Embedding Model
        embeddings_model = OpenAIEmbeddings(model=EMBED_MODEL)
        logger.info("Embedding model initialized.")

        # ✅ Initialize Pinecone
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
            logger.info("⏳ Waiting for index to be ready...")
            while not pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
                time.sleep(5)
            logger.info("✅ Index created.")
        else:
            logger.info(f"Using existing index '{PINECONE_INDEX_NAME}'.")

        # Initialize index
        index = pc.Index(PINECONE_INDEX_NAME)
        logger.info("Checking index status...")

        # Get vector count
        # Get vector count
        vector_count = get_vector_count(index)
        logger.info(f"Connected to index. Current vector count: {vector_count}")

        # ✅ LangChain VectorStore Wrapper
        vector_store = PineconeVectorStore(
            index_name=PINECONE_INDEX_NAME, embedding=embeddings_model
        )

        # ✅ Initialize LLM (OpenAI Chat Model)
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
        logger.info("LLM initialized.")

        retriever = vector_store.as_retriever(
            search_type="similarity", search_kwargs={"k": 10}
        )
        prompt_template = ChatPromptTemplate.from_template(
            """
            You are an AI medical assistant. 
            Use ONLY the provided context from the dataset. 
            Do not make up facts. 
            If the context does not contain the answer, say so clearly.

            **Context:**
            {context}

            **Question:**
            {input}

            **Answer (based only on context):**
            """
        )
        document_chain = create_stuff_documents_chain(llm, prompt_template)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)
        logger.info("RAG chain created.")

    except Exception as e:
        logger.error(f"Failed to initialize RAG system: {e}")
        raise Exception(f"RAG initialization failed: {e}")


# ✅ Initialize RAG system on startup
initialize_rag_system()


# --- DB Connection ---
def get_db_connection():
    return psycopg2.connect(
        dbname=settings.DB_NAME,
        user=settings.DB_USER,
        password=settings.DB_PASSWORD,
        host=settings.DB_HOST,
        port=settings.DB_PORT,
    )


# --- Chat History Storage ---
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
