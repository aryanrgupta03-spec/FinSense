from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.services.seed_data import seed_database
from app.api import (
    auth,
    overview,
    transactions,
    budgets,
    goals,
    cashflow,
    insights,
    savings_planner,
    bills,
    investment,
    copilot,
    reports,
    settings as settings_api
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create tables
    Base.metadata.create_all(bind=engine)
    # 2. Seed initial demonstration dataset
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "Autonomous AI-Powered Personal Finance Management System unifying transaction intelligence, "
        "budget management, savings optimization, cash-flow forecasting, decision support, and financial copilot."
    ),
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local Vite frontend & container communication
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under both /api/v1 and /api
routers = [
    auth.router,
    overview.router,
    transactions.router,
    budgets.router,
    goals.router,
    cashflow.router,
    insights.router,
    savings_planner.router,
    bills.router,
    investment.router,
    copilot.router,
    reports.router,
    settings_api.router
]

for r in routers:
    app.include_router(r, prefix=settings.API_V1_PREFIX)
    app.include_router(r, prefix="/api")

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_prefix": settings.API_V1_PREFIX,
        "status": "online"
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy", "database": "connected"}
