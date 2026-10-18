from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.finance import Account, Budget, Goal, Transaction
from app.models.intelligence import AssessmentRecord
from app.schemas.intelligence import InvestmentReadinessResponse
from app.api.deps import get_current_user
from app.services.investment_readiness import investment_readiness_engine

router = APIRouter(prefix="/investment", tags=["Investment Readiness"])

@router.get("", response_model=InvestmentReadinessResponse)
def get_investment_readiness(
    emergency_months: Optional[float] = Query(None),
    expense_stability: Optional[float] = Query(None),
    goal_progress: Optional[float] = Query(None),
    monthly_surplus: Optional[float] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    total_balance = sum(a.balance for a in accounts)

    # Calculate actual financial parameters if not overridden
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    essential_burn = sum(b.limit_amount for b in budgets if b.category and b.category.is_essential) or 40000.0

    calc_ef = round(total_balance / max(1000.0, essential_burn), 1) if emergency_months is None else emergency_months
    calc_stab = 78.0 if expense_stability is None else expense_stability

    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    total_g_target = sum(g.target_amount for g in goals)
    total_g_curr = sum(g.current_amount for g in goals)
    calc_gp = round((total_g_curr / max(1.0, total_g_target)) * 100, 1) if goal_progress is None else goal_progress

    # Surplus
    monthly_income = current_user.monthly_income or 125000.0
    first_of_month = date(today.year, today.month, 1)
    txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= first_of_month,
            Transaction.transaction_type == "expense"
        )
        .all()
    )
    total_spent = sum(t.amount for t in txs)
    calc_surplus = max(0.0, monthly_income - total_spent) if monthly_surplus is None else monthly_surplus

    result = investment_readiness_engine.evaluate(
        emergency_coverage_months=calc_ef,
        expense_stability_score=calc_stab,
        goal_progress_pct=calc_gp,
        monthly_surplus_inr=calc_surplus
    )

    # Persist assessment record
    rec = AssessmentRecord(
        user_id=current_user.id,
        fuzzy_urgency_score=25.0,
        fuzzy_status="Normal",
        mamdani_readiness_score=result["mamdani_readiness_score"],
        mamdani_status=result["mamdani_status"],
        sugeno_investable_surplus=result["sugeno_investable_surplus"],
        inputs_json=result["inputs"],
        explanations_json={"comparison": result["comparison_analysis"]}
    )
    db.add(rec)
    db.commit()

    return result
