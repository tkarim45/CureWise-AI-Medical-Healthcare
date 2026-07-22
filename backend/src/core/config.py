"""Application configuration.

All settings are read from environment variables (loaded from ``backend/.env``
in development). Model weight paths default to the repo-relative ``data/``
folder so the app is portable across machines, but each can be overridden with
its ``*_MODEL_PATH`` env var.
"""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/ (parent of src/)
BASE_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = BASE_DIR / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        protected_namespaces=(),
    )

    # --- Auth / JWT ---
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- CORS (comma-separated string; see allowed_origins_list) ---
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    # --- LLM / RAG providers ---
    OPENAI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    PINECONE_API_KEY: str = ""
    LLAMA_PARSER_API_KEY: str = ""

    # --- PostgreSQL ---
    DB_NAME: str = "curewise"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_HOST: str = "localhost"
    DB_PORT: str = "5432"

    # --- ML model weights (repo-relative defaults, env-overridable) ---
    KIDNEY_MODEL_PATH: str = str(DATA_DIR / "kidney_disease/Model/kidney_ct_model_1.h5")
    BREAST_CANCER_MODEL_PATH: str = str(DATA_DIR / "Breast Cancer/Model/Breast Cancer.h5")
    LYMPHOMA_MODEL_PATH: str = str(DATA_DIR / "Lymphoma/Lymphoma classification1.h5")
    PNEUMONIA_MODEL_PATH: str = str(DATA_DIR / "pneumonia/model-Pneumonia Detection-88.04.h5")
    EYE_DISEASE_MODEL_PATH: str = str(DATA_DIR / "eyedisease/eyedisease.h5")
    BLOODCELL_MARKER_MODEL_PATH: str = str(DATA_DIR / "bloodcell/blood_cells_model.h5")
    BLOODCELL_TYPE_MODEL_PATH: str = str(DATA_DIR / "bloodcell/image_classification_model.h5")


settings = Settings()
