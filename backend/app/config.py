from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "FinSense Autonomous AI Personal Finance System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./finsense.db")
    
    # JWT Authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "finsense-super-secure-production-jwt-secret-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    
    # Optional LLM / SLM Integration
    SLM_ENABLED: bool = True
    SLM_API_BASE: Optional[str] = os.getenv("SLM_API_BASE", "http://localhost:11434/v1")  # e.g. local Ollama / vLLM
    SLM_API_KEY: Optional[str] = os.getenv("SLM_API_KEY", "")
    SLM_MODEL_NAME: str = os.getenv("SLM_MODEL_NAME", "llama3.2:1b")
    
    # Currency
    DEFAULT_CURRENCY: str = "INR"
    CURRENCY_SYMBOL: str = "₹"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
