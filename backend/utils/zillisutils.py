import os
import logging
import numpy as np
import pandas as pd
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from pymilvus import (
    connections,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
    utility,
)
from langchain_core.documents import Document
import uuid
import psycopg2
from datetime import datetime
from config.settings import settings

# --- Configuration ---
EMBEDDING_DIMENSION = 768
COLLECTION_NAME = "medical_conversations_rag"
ZILLIZ_URI = settings.ZILLIZ_URI
ZILLIZ_TOKEN = settings.ZILLIZ_TOKEN

# --- Logging ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("zillis_rag")

# --- Connect to Zilliz/Milvus ---
connections.connect(uri=ZILLIZ_URI, token=ZILLIZ_TOKEN)
logger.info(f"Connected to Zilliz/Milvus at {ZILLIZ_URI}")

# --- Use existing collection or create if not exists ---
if COLLECTION_NAME in utility.list_collections():
    collection = Collection(COLLECTION_NAME)
    logger.info(f"Using existing collection '{COLLECTION_NAME}'.")
else:
    fields = [
        FieldSchema(
            name="id",
            dtype=DataType.VARCHAR,
            max_length=64,
            is_primary=True,
            auto_id=False,
        ),
        FieldSchema(
            name="qtype", dtype=DataType.VARCHAR, max_length=32, is_primary=False
        ),
        FieldSchema(
            name="Question", dtype=DataType.VARCHAR, max_length=1024, is_primary=False
        ),
        FieldSchema(
            name="Answer", dtype=DataType.VARCHAR, max_length=65000, is_primary=False
        ),
        FieldSchema(
            name="embedding",
            dtype=DataType.FLOAT_VECTOR,
            dim=EMBEDDING_DIMENSION,
            is_primary=False,
        ),
        FieldSchema(name="chunk_index", dtype=DataType.INT64, is_primary=False),
        FieldSchema(
            name="answer_group_id",
            dtype=DataType.VARCHAR,
            max_length=64,
            is_primary=False,
        ),
    ]
    schema = CollectionSchema(fields, description="RAG QnA collection with chunking")
    collection = Collection(COLLECTION_NAME, schema)
    logger.info(f"Collection '{COLLECTION_NAME}' created.")

# --- Embedding Model ---
embedding_model = GoogleGenerativeAIEmbeddings(model="models/embedding-001")


# --- Chunking utility ---
def chunk_text(text, chunk_size):
    return [text[i : i + chunk_size] for i in range(0, len(text), chunk_size)]


# --- Data Insertion Function ---
def insert_dataframe(df, chunk_size=65000, batch_size=500):
    ids = []
    qtypes = []
    questions = []
    answers = []
    embeds = []
    chunk_indexes = []
    group_ids = []
    for idx, row in df.iterrows():
        answer = str(row["Answer"])
        answer_chunks = chunk_text(answer, chunk_size)
        group_id = str(uuid.uuid4())
        for chunk_idx, chunk in enumerate(answer_chunks):
            ids.append(str(uuid.uuid4()))
            qtypes.append(str(row["qtype"]))
            questions.append(str(row["Question"]))
            answers.append(chunk)
            chunk_indexes.append(chunk_idx)
            group_ids.append(group_id)
    # Generate embeddings for all questions (repeat for each chunk)
    question_embeddings = embedding_model.embed_documents(questions)
    embeds = np.array(question_embeddings, dtype=np.float32)
    # Insert in batches
    for start in range(0, len(ids), batch_size):
        end = start + batch_size
        batch = [
            ids[start:end],
            qtypes[start:end],
            questions[start:end],
            answers[start:end],
            embeds[start:end].tolist(),
            chunk_indexes[start:end],
            group_ids[start:end],
        ]
        collection.insert(batch)
    collection.flush()
    logger.info(f"Inserted {len(ids)} rows (with chunking) into '{COLLECTION_NAME}'.")


# --- Index Creation (if not exists) ---
if not collection.has_index():
    index_params = {
        "metric_type": "L2",
        "index_type": "IVF_FLAT",
        "params": {"nlist": 1024},
    }
    collection.create_index(field_name="embedding", index_params=index_params)
    logger.info("Index created on embedding field.")

# --- Load Collection for Search ---
collection.load()
logger.info("Collection loaded for search.")

# --- RAG Chain Setup ---
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash-latest", temperature=0.3)
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


# --- Retrieval Function ---
def retrieve_context(query, top_k=3):
    query_emb = embedding_model.embed_query(query)
    results = collection.search(
        data=[query_emb],
        anns_field="embedding",
        param={"metric_type": "L2", "params": {"nprobe": 10}},
        limit=top_k,
        output_fields=["qtype", "Question", "Answer", "chunk_index", "answer_group_id"],
    )
    docs = []
    for hits in results:
        for hit in hits:
            docs.append(
                Document(
                    page_content=hit.entity.get("Answer", ""),
                    metadata={
                        "qtype": hit.entity.get("qtype", ""),
                        "Question": hit.entity.get("Question", ""),
                        "chunk_index": hit.entity.get("chunk_index", 0),
                        "answer_group_id": hit.entity.get("answer_group_id", ""),
                    },
                )
            )
    return docs


# --- RAG QA Function ---
def rag_qa(question, history=""):
    context = retrieve_context(question)
    input_vars = {
        "history": history,
        "context": context,  # pass as list of Document
        "input": question,
    }
    return document_chain.invoke(input_vars)


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
