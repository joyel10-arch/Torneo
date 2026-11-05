from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "Torneo"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./torneo.db"
    SECRET_KEY: str = "torneo-secret-key-change-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    BACKEND_CORS_ORIGINS: list = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
