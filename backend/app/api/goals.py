from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.finance import Goal, Account, Transaction
from app.schemas.finance import GoalCreate, GoalUpdate, GoalOut, GoalProjection
from app.api.deps import get_current_user

router = APIRouter(prefix="/goals", tags=["Savings Goals"])

@router.get("", response_model=List[Dict[str, Any]])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    results = []

    # Current monthly surplus estimate
    monthly_income = current_user.monthly_income or 125000.0
    monthly_expenses = 75000.0  # Representative baseline
    baseline_surplus = max(0.0, monthly_income - monthly_expenses)

    for g in goals:
        days_rem = max(1, (g.deadline - today).days)
        months_rem = max(0.5, round(days_rem / 30.4, 1))
        remaining_target = max(0.0, g.target_amount - g.current_amount)
        required_monthly = round(remaining_target / months_rem, 2)
        pct = round((g.current_amount / max(1.0, g.target_amount)) * 100, 1)

        if required_monthly <= baseline_surplus:
            feasibility = "On Track"
        elif required_monthly <= baseline_surplus * 1.3:
            feasibility = "Needs Adjustment"
        else:
            feasibility = "At Risk"

        results.append({
            "id": g.id,
            "name": g.name,
            "target_amount": g.target_amount,
            "current_amount": g.current_amount,
            "deadline": g.deadline.strftime("%Y-%m-%d"),
            "priority": g.priority,
            "notes": g.notes,
            "days_remaining": days_rem,
            "months_remaining": months_rem,
            "required_monthly_savings": required_monthly,
            "completion_percentage": min(100.0, pct),
            "feasibility_status": feasibility
        })

    return results

@router.post("", response_model=GoalOut)
def create_goal(
    g_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    g = Goal(user_id=current_user.id, **g_in.model_dump())
    db.add(g)
    db.commit()
    db.refresh(g)
    return g

@router.put("/{g_id}", response_model=GoalOut)
def update_goal(
    g_id: int,
    g_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    g = db.query(Goal).filter(Goal.id == g_id, Goal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    for k, v in g_update.model_dump(exclude_unset=True).items():
        setattr(g, k, v)
    db.commit()
    db.refresh(g)
    return g

@router.delete("/{g_id}")
def delete_goal(
    g_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    g = db.query(Goal).filter(Goal.id == g_id, Goal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(g)
    db.commit()
    return {"message": "Goal removed successfully"}

@router.post("/{g_id}/contribute")
def contribute_to_goal(
    g_id: int,
    amount: float,
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == g_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    acct = db.query(Account).filter(Account.id == account_id, Account.user_id == current_user.id).first()
    if not acct:
        raise HTTPException(status_code=400, detail="Account not found")

    if acct.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient account balance")

    acct.balance -= amount
    goal.current_amount += amount
    db.commit()
    db.refresh(goal)

    return {
        "message": f"Successfully allocated ₹{amount:,.2f} to {goal.name}",
        "new_goal_amount": goal.current_amount,
        "remaining_target": max(0.0, goal.target_amount - goal.current_amount)
    }
