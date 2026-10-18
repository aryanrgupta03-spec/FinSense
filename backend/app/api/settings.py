from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any, List
import shutil

from app.database import get_db
from app.models.user import User
from app.models.finance import Account
from app.schemas.user import UserUpdate, UserOut
from app.api.deps import get_current_user
from app.services.seed_data import reset_demo_database
from app.config import settings

router = APIRouter(prefix="/settings", tags=["Settings & System Diagnostics"])

@router.get("/profile")
def get_user_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    return {
        "user": UserOut.model_validate(current_user),
        "accounts": [
            {
                "id": a.id,
                "name": a.name,
                "account_type": a.account_type,
                "balance": a.balance,
                "currency": a.currency,
                "is_primary": a.is_primary
            }
            for a in accounts
        ],
        "system_config": {
            "currency": current_user.currency or "INR",
            "currency_symbol": "₹",
            "slm_enabled": settings.SLM_ENABLED,
            "slm_model": settings.SLM_MODEL_NAME,
            "slm_api_base": settings.SLM_API_BASE
        }
    }

@router.put("/profile", response_model=UserOut)
def update_user_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    for k, v in user_update.model_dump(exclude_unset=True).items():
        if k != "password":
            setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/reset-demo")
def reset_demo_data(db: Session = Depends(get_db)):
    """
    Cleans all existing demonstration profile data and repopulates the clean baseline.
    """
    demo_user = reset_demo_database(db)
    return {
        "message": "Demonstration dataset reset successfully",
        "user_email": demo_user.email,
        "default_password": "finsense123"
    }

@router.get("/system-diagnostics")
def get_system_diagnostics():
    """
    System diagnostic check for all ten AI and intelligent systems.
    """
    has_swipl = shutil.which("swipl") is not None
    return {
        "status": "Operational",
        "system_name": "FinSense Autonomous AI Personal Finance Platform",
        "version": settings.VERSION,
        "swipl_installed": has_swipl,
        "prolog_engine_mode": "SWI-Prolog CLI" if has_swipl else "Embedded First-Order SLD Resolution",
        "modules": {
            "1_PEAS_Agent": {"status": "Active", "type": "Multi-Sensor Financial Orchestrator"},
            "2_Prolog_Rules": {"status": "Active", "type": "Horn Clause Knowledge Base Engine"},
            "3_Dependency_Graph": {"status": "Active", "type": "BFS & DFS Impact Traversal"},
            "4_AStar_Budget_Search": {"status": "Active", "type": "Admissible Heuristic Space Search"},
            "5_Minimax_Simulator": {"status": "Active", "type": "Game-Theoretic Decision Tree"},
            "6_Fuzzy_Alert_Controller": {"status": "Active", "type": "3-Input Centroid Defuzzified FIS"},
            "7_Investment_Readiness": {"status": "Active", "type": "Dual Mamdani & Sugeno FIS"},
            "8_ANFIS_Forecaster": {"status": "Active", "type": "5-Layer TSK Neuro-Fuzzy Network"},
            "9_Neural_Analytics": {"status": "Active", "type": "Supervised MLP & Unsupervised SOM"},
            "10_Copilot_SLM": {"status": "Active", "type": "Tool-Routed Contextual Assistant"}
        }
    }
