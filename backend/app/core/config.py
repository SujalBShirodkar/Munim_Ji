import os
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

# Load .env file from root or backend
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env"))


class Settings(BaseModel):
    # App
    APP_NAME: str = "Munim Ji API"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    ALLOW_PRODUCTION: bool = os.getenv("ALLOW_PRODUCTION", "false").lower() == "true"
    PORT: int = int(os.getenv("PORT", "8000"))
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
    ]

    # Database
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME: str = os.getenv("MONGO_DB_NAME", "munim_ji")

    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "munim_ji_super_secret_jwt_key_2026_hackathon_demo")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRES_MINUTES: int = int(os.getenv("JWT_EXPIRES_MINUTES", "1440"))

    # Groq LLM
    GROQ_API_KEY: Optional[str] = os.getenv("GROQ_API_KEY")
    GROQ_MODEL_MAIN: str = os.getenv("GROQ_MODEL_MAIN", "llama-3.3-70b-versatile")
    GROQ_MODEL_FAST: str = os.getenv("GROQ_MODEL_FAST", "llama-3.1-8b-instant")

    # Voice (Deepgram & Cartesia)
    DEEPGRAM_API_KEY: Optional[str] = os.getenv("DEEPGRAM_API_KEY")
    CARTESIA_API_KEY: Optional[str] = os.getenv("CARTESIA_API_KEY")
    CARTESIA_VOICE_ID: str = os.getenv("CARTESIA_VOICE_ID", "a0e99841-438c-4a64-b679-ae501e7d6091")

    # Payments & Paytm
    # Options: 'mock' (simulated offline) or 'sandbox' (real Paytm staging)
    PAYMENTS_MODE: str = os.getenv("PAYMENTS_MODE", "mock").lower()
    PAYTM_MID: str = os.getenv("PAYTM_MID", "YOUR_STAGING_MID")
    PAYTM_MERCHANT_KEY: str = os.getenv("PAYTM_MERCHANT_KEY", "YOUR_STAGING_KEY")
    PAYTM_WEBSITE: str = os.getenv("PAYTM_WEBSITE", "WEBSTAGING")
    PAYTM_INDUSTRY_TYPE: str = os.getenv("PAYTM_INDUSTRY_TYPE", "Retail")
    PAYTM_HOST: str = os.getenv("PAYTM_HOST", "https://securegw-stage.paytm.in")
    PAYTM_CALLBACK_URL: str = os.getenv("PAYTM_CALLBACK_URL", "http://localhost:8000/payments/paytm/callback")
    PAYTM_WEBHOOK_URL: str = os.getenv("PAYTM_WEBHOOK_URL", "http://localhost:8000/payments/paytm/webhook")

    def validate_production_guard(self):
        """Enforces that real money / production hosts are blocked unless explicitly configured."""
        if not self.ALLOW_PRODUCTION:
            prod_patterns = ["securegw.paytm.in", "secure.paytm.in"]
            for pattern in prod_patterns:
                if pattern in self.PAYTM_HOST.lower():
                    raise RuntimeError(
                        f"FATAL: Production Paytm host '{self.PAYTM_HOST}' detected but ALLOW_PRODUCTION is False. "
                        "Munim Ji strictly disallows production hosts without ALLOW_PRODUCTION=true."
                    )


settings = Settings()
settings.validate_production_guard()

