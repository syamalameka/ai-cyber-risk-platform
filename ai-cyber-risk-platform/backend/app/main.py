from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.data.seed_data import seed_database
from app.services.risk_engine import evaluate_and_update_all_risks
from app.services.ml_engine import ml_engine
from app.services.correlation_engine import correlate_events_to_attack_chains

# Import all API routers
from app.api.auth import router as auth_router
from app.api.assets import router as assets_router
from app.api.vulnerabilities import router as vulns_router
from app.api.threat_intel import router as intel_router
from app.api.events import router as events_router
from app.api.risk import router as risk_router
from app.api.correlation import router as correlation_router
from app.api.ml_routes import router as ml_router
from app.api.ai_analyst import router as ai_analyst_router
from app.api.reports import router as reports_router

def init_app_state():
    """Initializes tables, seeds data, evaluates risks, and trains ML models."""
    print("[*] Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_database(db)
        evaluate_and_update_all_risks(db)
        correlate_events_to_attack_chains(db)
    finally:
        db.close()
        
    print("[*] Preparing ML Threat Detection models...")
    ml_engine.load_or_train()

# Ensure tables and baseline seed exist upon module import
init_app_state()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_app_state()
    print("[✓] AI Cyber Risk & Threat Intelligence Platform backend is ready!")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Enterprise-grade AI Cyber Risk Assessment and Threat Intelligence Platform",
    lifespan=lifespan
)

# CORS configuration allowing local React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(assets_router, prefix=settings.API_V1_STR)
app.include_router(vulns_router, prefix=settings.API_V1_STR)
app.include_router(intel_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(risk_router, prefix=settings.API_V1_STR)
app.include_router(correlation_router, prefix=settings.API_V1_STR)
app.include_router(ml_router, prefix=settings.API_V1_STR)
app.include_router(ai_analyst_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }
