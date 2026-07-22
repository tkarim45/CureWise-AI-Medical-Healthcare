# CureWise

CureWise is a personal AI health companion. One account gives a user a set of
self-serve tools that help them understand their health calmly, then point them
toward professional care. It informs; it does not diagnose.

There are no hospital, doctor, admin, or appointment features. Every account is a
single `user` role.

---

## What it does

- **Health assistant** — a chatbot grounded in a curated medical knowledge base
  (RAG over Pinecone), with plain-language answers.
- **Blood report reader** — upload a lab PDF, get it parsed (LlamaParse) and
  explained in plain words, with a structured results table.
- **Image screening** — screen a medical image across seven trained models:
  kidney (CT), lymphoma, pneumonia, eye disease, breast-cancer imaging
  (segmentation), blood-cell type, and AML genetic markers.
- **Skin & acne check** — a first read on a skin photo using a vision model.
- **Per-condition chat** — a specialist assistant for each disease area.
- **Nearby care** — find hospitals near the user's location (OpenStreetMap
  Overpass), for emergencies.

Every AI result carries a persistent disclaimer: CureWise informs, and does not
diagnose.

---

## Tech stack

**Backend** — FastAPI, PostgreSQL (raw SQL over a pooled connection), JWT auth
(python-jose + passlib/bcrypt). LLMs: OpenAI `gpt-4o-mini` (chat, embeddings,
report structuring), Groq `llama-3.3-70b` / `llama-4-scout` (per-disease chat,
skin vision). RAG on Pinecone (`text-embedding-3-small`, 1536-dim). Blood-report
parsing via LlamaParse. Image models are Keras/TensorFlow `.h5` files loaded
lazily and cached.

**Frontend** — Next.js 16 (App Router), React 19, TypeScript, Tailwind v4. Light
and dark themes, calm clinical design, WCAG 2.2 AA. See `DESIGN.md` and
`PRODUCT.md`.

---

## Backend architecture

Feature-first layout under `backend/src`:

```
backend/src/
  main.py                 # app factory, router mounting, lifespan
  core/                   # config, pooled database, security (JWT), deps, logging
  db/schema.py            # users, medical_history, general_chat_history
  auth/                   # signup / login / me
  features/
    profile/              # each feature: router.py, service.py, schemas.py
    medical_history/
    chat/                 #   RAG chatbot (rag.py)
    medical_report/       #   LlamaParse + structuring (parser.py)
    skin/                 #   acne vision
    emergency/            #   nearby hospitals
    disease_detection/    #   registry of 7 models (specs.py, registry.py)
```

Adding a new image model is a data change in
`features/disease_detection/specs.py` (key, weights path, input size, labels,
optional chat prompt), not new endpoint code. The routes are:

```
GET  /api/disease-detection                      # list models
POST /api/disease-detection/{disease}/classify   # image -> prediction
POST /api/disease-detection/{disease}/chat        # specialist Q&A
```

Model weights are large (~1.2 GB total) and are not committed; they live under
`backend/data/` and are gitignored. Provision them out of band.

---

## Setup

### Backend

```bash
cd backend
cp .env.example .env          # fill in API keys + DB settings
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Requires a running PostgreSQL. The schema is created automatically on startup.

### Frontend

```bash
cd frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL, defaults to localhost:8000
npm install
npm run dev                   # http://localhost:3000
```

### Docker

```bash
docker compose up --build     # postgres + backend (8000) + frontend (3000)
```

Model weights are mounted from `./backend/data` into the backend container.

---

## Directory structure

```
CureWise-AI-Medical-Healthcare/
├── backend/          # FastAPI app (src/ feature layout), model weights in data/
├── frontend/         # Next.js 16 app
├── docker-compose.yml
├── PRODUCT.md        # strategic product brief
├── DESIGN.md         # visual system (tokens, type, components)
└── README.md
```

---

## License

See repository license.
