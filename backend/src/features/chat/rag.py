"""RAG retrieval chain over the CureWise medical knowledge base (Pinecone).

The chain is initialized once at application startup via :func:`init_rag` and
reused for every query. This replaces the old hospital-routing agent: there is
no ``db_query`` branch any more, every question goes straight to retrieval.
"""

import logging
import os
import time

from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from pinecone import Pinecone, ServerlessSpec

from src.core.config import settings

logger = logging.getLogger(__name__)

PINECONE_INDEX_NAME = "curewise-medical-rag"
EMBED_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSION = 1536

_PROMPT = ChatPromptTemplate.from_template(
    """
You are CureWise, an AI medical assistant.
Use ONLY the provided context from the knowledge base. Do not invent facts.
If the context does not contain the answer, say so clearly and suggest the user
consult a qualified healthcare professional.

Previous conversation:
{history}

Context:
{context}

Question:
{input}

Answer (based only on the context):
"""
)

_retrieval_chain = None


def init_rag() -> None:
    """Build the retrieval chain. Idempotent; safe to call at startup."""
    global _retrieval_chain
    if _retrieval_chain is not None:
        return

    os.environ.setdefault("OPENAI_API_KEY", settings.OPENAI_API_KEY)
    os.environ.setdefault("PINECONE_API_KEY", settings.PINECONE_API_KEY)

    embeddings = OpenAIEmbeddings(model=EMBED_MODEL)
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)

    if PINECONE_INDEX_NAME not in pc.list_indexes().names():
        logger.info("Creating Pinecone index '%s'", PINECONE_INDEX_NAME)
        pc.create_index(
            name=PINECONE_INDEX_NAME,
            dimension=EMBEDDING_DIMENSION,
            metric="cosine",
            spec=ServerlessSpec(cloud="aws", region="us-east-1"),
        )
        while not pc.describe_index(PINECONE_INDEX_NAME).status["ready"]:
            time.sleep(5)

    vector_store = PineconeVectorStore(
        index_name=PINECONE_INDEX_NAME, embedding=embeddings
    )
    retriever = vector_store.as_retriever(
        search_type="similarity", search_kwargs={"k": 10}
    )
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.3)
    document_chain = create_stuff_documents_chain(llm, _PROMPT)
    _retrieval_chain = create_retrieval_chain(retriever, document_chain)
    logger.info("RAG retrieval chain ready")


def answer(query: str, history_text: str = "") -> str:
    if _retrieval_chain is None:
        init_rag()
    result = _retrieval_chain.invoke({"input": query, "history": history_text})
    return result.get("answer", "No answer found.")
