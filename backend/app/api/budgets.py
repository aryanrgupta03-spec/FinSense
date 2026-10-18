from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.finance import Budget, Category, Transaction
from app.schemas.finance import BudgetCreate, BudgetUpdate, BudgetOut, BudgetStatus, CategoryOut
from app.api.deps import get_current_user
from app.services.prolog_engine import prolog_engine
from app.services.fuzzy_controller import fuzzy_spending_controller

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=Dict[str, Any])
def get_budgets(
    period: Optional[str] = Query(None, description="e.g. '2026-10'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    curr_period = period or today.strftime("%Y-%m")
    first_of_month = date(int(curr_period.split("-")[0]), int(curr_period.split("-")[1]), 1)
    days_in_month = 30
    days_passed = max(1, min(days_in_month, today.day if period is None or period == today.strftime("%Y-%m") else 30))
    days_remaining = max(1, days_in_month - days_passed)

    budgets = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.period == curr_period).all()
    statuses = []
    total_budget = 0.0
    total_spent = 0.0

    prolog_budget_items = []

    for b in budgets:
        cat_name = b.category.name if b.category else f"Cat-{b.category_id}"
        # Sum transactions
        spent_txs = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == b.category_id,
                Transaction.date >= first_of_month,
                Transaction.transaction_type == "expense"
            )
            .all()
        )
        spent = sum(t.amount for t in spent_txs)
        remaining = b.limit_amount - spent
        pct = round((spent / max(1.0, b.limit_amount)) * 100, 1)
        avg_daily = round(spent / days_passed, 2)
        projected = round(spent + (avg_daily * days_remaining), 2)
        overrun = max(0.0, spent - b.limit_amount)

        if spent > b.limit_amount:
            stat = "exceeded"
        elif pct >= 80.0:
            stat = "approaching"
        else:
            stat = "normal"

        statuses.append({
            "id": b.id,
            "category_id": b.category_id,
            "category_name": cat_name,
            "category_icon": b.category.icon if b.category else "tag",
            "is_essential": b.category.is_essential if b.category else False,
            "limit_amount": b.limit_amount,
            "spent_amount": round(spent, 2),
            "remaining_amount": round(remaining, 2),
            "percentage_consumed": pct,
            "average_daily_spending": avg_daily,
            "projected_month_end_spending": projected,
            "overrun_amount": round(overrun, 2),
            "status": stat
        })

        prolog_budget_items.append({"category": cat_name, "spent": spent, "limit": b.limit_amount})
        total_budget += b.limit_amount
        total_spent += spent

    # Overall burn rate
    pro_rata = (total_budget * (days_passed / days_in_month)) if total_budget > 0 else 1.0
    burn_rate = round(total_spent / max(1.0, pro_rata), 2)

    # Fuzzy Alert
    fuzzy_eval = fuzzy_spending_controller.evaluate(burn_rate, days_remaining, 60.0)

    # Prolog Rule Verification Audit
    prolog_audit = prolog_engine.audit_financial_state(
        budgets=prolog_budget_items,
        bills=[],
        emergency_reserve=200000.0,
        monthly_essential_burn=total_budget * 0.5,
        goals=[],
        monthly_surplus=30000.0
    )

    return {
        "period": curr_period,
        "total_budget": round(total_budget, 2),
        "total_spent": round(total_spent, 2),
        "total_remaining": round(total_budget - total_spent, 2),
        "burn_rate": burn_rate,
        "fuzzy_alert_status": fuzzy_eval["status"],
        "fuzzy_urgency_score": fuzzy_eval["urgency_score"],
        "budgets": statuses,
        "prolog_findings": [f for f in prolog_audit["findings"] if f["rule_type"] in ["budget_violation", "approaching_limit"]]
    }

@router.post("", response_model=BudgetOut)
def create_budget(
    b_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cat = db.query(Category).filter(Category.id == b_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=400, detail="Invalid category")

    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category_id == b_in.category_id,
            Budget.period == b_in.period
        )
        .first()
    )
    if existing:
        existing.limit_amount = b_in.limit_amount
        db.commit()
        db.refresh(existing)
        return existing

    b = Budget(user_id=current_user.id, **b_in.model_dump())
    db.add(b)
    db.commit()
    db.refresh(b)
    return b

@router.put("/{b_id}", response_model=BudgetOut)
def update_budget(
    b_id: int,
    b_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Budget).filter(Budget.id == b_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    b.limit_amount = b_update.limit_amount
    db.commit()
    db.refresh(b)
    return b

@router.delete("/{b_id}")
def delete_budget(
    b_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Budget).filter(Budget.id == b_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(b)
    db.commit()
    return {"message": "Budget removed successfully"}

@router.get("/categories", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).all()
