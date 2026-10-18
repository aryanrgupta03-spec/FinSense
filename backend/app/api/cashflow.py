from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.finance import Account, Transaction, RecurringBill
from app.api.deps import get_current_user
from app.services.anfis_forecast import anfis_forecaster

router = APIRouter(prefix="/cashflow", tags=["Cash Flow Forecasting"])

@router.get("", response_model=Dict[str, Any])
def get_cashflow_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    total_balance = sum(a.balance for a in accounts)

    # Monthly spending so far
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
    days_passed = max(1, today.day)
    avg_daily_spend = round(total_spent / days_passed, 2)
    days_remaining = max(1, 30 - today.day)

    # Fixed upcoming bills
    bills = db.query(RecurringBill).filter(RecurringBill.user_id == current_user.id, RecurringBill.status == "active").all()
    upcoming_bills = sum(b.amount for b in bills if 0 <= (b.next_due_date - today).days <= days_remaining)

    # Salary inflow: if salary is credited on 1st and we are near month end, expect inflow
    salary_inflow = current_user.monthly_income if days_remaining <= 4 else 0.0

    forecast = anfis_forecaster.generate_forecast(
        current_balance=total_balance,
        average_daily_spend=avg_daily_spend,
        upcoming_fixed_bills=upcoming_bills,
        expected_salary_inflow=salary_inflow,
        days_remaining_in_month=days_remaining
    )

    return forecast
