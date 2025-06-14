import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    DB_PATH = os.getenv(
        "DB_PATH",
        "/Users/taimourabdulkarim/Documents/Personal Github Repositories/HealthSync-AI/backend/healthsync.db",
    )
    JWT_SECRET = os.getenv("JWT_SECRET")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))
    ALLOWED_ORIGINS = ["http://localhost:3000"]
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    ZILLIZ_URI = os.getenv("ZILLIZ_URI")
    ZILLIZ_TOKEN = os.getenv("ZILLIZ_TOKEN")

    # Email settings
    EMAIL_SENDER: str = os.getenv("EMAIL_SENDER")
    EMAIL_PASSWORD: str = os.getenv("EMAIL_PASSWORD")
    SMTP_SERVER: str = os.getenv("SMTP_SERVER")
    SMTP_PORT: int = os.getenv("SMTP_PORT")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY")

    # PostgreSQL database connection settings
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    DB_HOST = os.getenv("DB_HOST")
    DB_PORT = os.getenv("DB_PORT")

    KIDNEY_MODEL_PATH = os.getenv("KIDNEY_MODEL_PATH")
    BREAST_CANCER_MODEL_PATH = os.getenv(
        "BREAST_CANCER_MODEL_PATH",
        os.path.join(
            os.path.dirname(__file__),
            "../data/Breast Cancer/Model/Breast Cancer.h5",
        ),
    )


settings = Settings()
