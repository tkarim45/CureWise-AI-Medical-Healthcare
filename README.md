# CureWise-AI: AI-Powered Healthcare Platform

**CureWise-AI** is a modern, production-grade healthcare data platform that leverages Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), and advanced AI/ML techniques to deliver intelligent analytics, medical report parsing, and conversational AI for hospitals, doctors, and patients.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Setup & Installation](#setup--installation)
- [Development & Contribution](#development--contribution)
- [License](#license)

---

## Project Overview

CureWise-AI brings together LLMs, RAG, and healthcare data engineering to provide:

- **Conversational AI** for medical queries, appointment booking, and patient support.
- **Automated parsing and structuring** of medical documents (e.g., blood reports) using LLMs.
- **Retrieval-Augmented Generation (RAG)** for context-aware, accurate responses using a vector database (Pinecone).
- **AI-powered analytics** and disease detection. Analyze patient images and provide a diagnosis.
- **Realtime Agents** connected with database to provide realtime analytics and insights.
- **Seamless integration** with hospital operations, doctor scheduling, and patient management.

---

## Key Features

- **LLM-Powered Chatbot:** Natural language interface for patients and doctors, powered by Gemini and Llama models.
- **RAG System:** Combines LLMs with Pinecone vector search for context-rich, accurate answers.
- **Medical Report Parsing:** Extracts and structures data from blood reports using LlamaParse and Groq.
- **Appointment Booking Agent:** Intelligent agent for scheduling, rescheduling, and querying appointments.
- **Acne & Disease Detection:** Image-based analysis using AI models (extendable for other conditions).
- **Memory & Context:** Maintains chat and report history for personalized, context-aware responses.
- **Extensible Tools:** Modular agent design for adding new tools and workflows.

---

## Architecture

```
[React Frontend] <---> [FastAPI Backend: LLM, RAG, AI] <---> [PostgreSQL, Pinecone]
                                              |
                                [LangChain, Llama, Groq, Gemini]
```

- **LLM Agents**: Orchestrate workflows, parse documents, and answer queries.
- **RAG**: Uses Pinecone for vector search over medical conversations and documents.
- **FastAPI**: Exposes REST APIs for all LLM and AI features.
- **PostgreSQL**: Stores chat, report, and appointment history.

---

## Tech Stack

- **LLMs**: Gemini (Google), Llama (Meta), Groq
- **RAG**: Pinecone, LangChain, Google Generative AI Embeddings
- **Backend**: FastAPI, Python, psycopg2
- **Frontend**: React
- **Database**: PostgreSQL
- **AI/ML**: LlamaParse, custom disease detection models
- **Containerization**: Docker

---

## Directory Structure

```
backend/
│
├── main.py                 # FastAPI app, API endpoints
├── utils/
│   ├── agents.py           # LLM agent orchestration, tools, booking agent
│   ├── pineconeutils.py    # RAG, Pinecone vector DB, retrieval chains
│   ├── parser.py           # LlamaParse, Groq, report parsing/structuring
│   ├── email.py            # Email utilities
│   └── ...                 # Other utilities
├── models/
│   └── schemas.py          # Pydantic schemas
├── config/
│   └── settings.py         # API keys, DB config
├── notebooks/
│   ├── RAG_Chatbot_Pinecone.ipynb
│   ├── LlamaParser.ipynb
│   └── ...                 # Demos and experiments
└── requirements.txt        # Python dependencies
```

---

## Setup & Installation

### Prerequisites

- Python 3.9+
- PostgreSQL
- Pinecone account (API key)
- Google Generative AI API key
- Groq API key
- LlamaParse API key

### 1. Clone the repository

```bash
git clone https://github.com/tkarim45/CureWise-AI-Medical-Healthcare.git
cd CureWise-AI-Medical-Healthcare
```

### 2. Docker Setup

```bash
docker compose up --build
```

### 3. Local Setup

#### 1. Create a virtual environment

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### 2. Configure Environment

- Set API keys and DB credentials in `config/settings.py` or as environment variables:
  - `GOOGLE_API_KEY`
  - `PINECONE_API_KEY`
  - `GROQ_API_KEY`
  - `LLAMA_PARSER_API_KEY`
  - `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`

#### 3. Run the Backend

```bash
uvicorn main:app --reload
```

#### 4. Run the Frontend

```bash
cd frontend
npm install
npm start
```

---

## PostgreSQL Setup (macOS)

To set up PostgreSQL for local development, run the following commands:

```sh
brew install postgresql
brew services start postgresql
psql -l
createdb curewise
psql -U tkarim45 -d curewise -h localhost
```

## PostgreSQL Setup (Windows)

To set up PostgreSQL for local development on **Windows**, follow these steps:

---

## 1. Install PostgreSQL

Download and install PostgreSQL from the official site:  
👉 [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)

During installation:

- Choose a version (e.g., **16** or **17**)
- Set a password for the default PostgreSQL user (`postgres`)
- Leave the port as **5432** (default)

> ✅ After installation, PostgreSQL runs automatically as a Windows service.

---

## Development & Contribution

- Fork and clone the repo.
- Use feature branches and submit PRs.
- Follow best practices for Python, LLM prompt engineering, and API design.
- Add tests and update documentation for new features.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgements

- [LangChain](https://python.langchain.com/)
- [Pinecone](https://www.pinecone.io/)
- [Google Generative AI](https://ai.google.dev/)
- [Groq](https://groq.com/)
- [LlamaParse](https://llamaindex.ai/)
- [FastAPI](https://fastapi.tiangolo.com/)

---

**For questions or support, open an issue or contact the maintainer.**

```

```
