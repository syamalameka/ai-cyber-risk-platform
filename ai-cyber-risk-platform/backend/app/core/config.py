import os

class Settings:
    PROJECT_NAME: str = "AI Cyber Risk & Threat Intelligence Platform"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-cyber-risk-jwt-key-9283719482")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # SQLite default, easily switchable to postgresql://user:pass@host/dbname
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./cyber_risk.db")
    
    # Gemini API Key (Optional, with offline fallback)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
