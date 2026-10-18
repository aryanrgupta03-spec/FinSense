from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models.user import User
from app.models.finance import Account, Transaction, Budget, Goal, RecurringBill
from app.api.deps import get_current_user
from app.services.agent_peas import peas_agent

router = APIRouter(prefix="/overview", tags=["Overview Dashboard"])

@router.get("")
def get_financial_overview(
    period: Optional[str] = Query(None, description="Month period e.g. '2026-10'"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    today = date.today()
    if period:
        try:
            year, month = map(int, period.split("-"))
            start_date = date(year, month, 1)
        except Exception:
            start_date = date(today.year, today.month, 1)
    else:
        start_date = date(today.year, today.month, 1)

    # Accounts and total liquid balance
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    total_balance = sum(a.balance for a in accounts)

    # Current period transactions
    end_date = (start_date + timedelta(days=32)).replace(day=1)
    current_txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= start_date,
            Transaction.date < end_date
        )
        .order_by(Transaction.date.desc())
        .all()
    )

    total_income = sum(t.amount for t in current_txs if t.transaction_type == "income")
    # If no explicit income recorded in current period, fall back to monthly income from profile
    if total_income == 0:
        total_income = current_user.monthly_income or 125000.0

    total_expenses = sum(t.amount for t in current_txs if t.transaction_type == "expense")
    net_savings = max(0.0, total_income - total_expenses)
    savings_rate = round((net_savings / max(1.0, total_income)) * 100, 1)

    # Previous month comparison for delta
    prev_start = (start_date - timedelta(days=1)).replace(day=1)
    prev_txs = (
        db.query(Transaction)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.date >= prev_start,
            Transaction.date < start_date
        )
        .all()
    )
    prev_expenses = sum(t.amount for t in prev_txs if t.transaction_type == "expense")
    expense_delta_pct = round(((total_expenses - prev_expenses) / max(1.0, prev_expenses)) * 100, 1) if prev_expenses > 0 else 0.0

    # Budgets
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    total_budget_limit = sum(b.limit_amount for b in budgets)
    budget_utilization = round((total_expenses / max(1.0, total_budget_limit)) * 100, 1) if total_budget_limit > 0 else 0.0

    # Spending category breakdown
    category_breakdown = {}
    for t in current_txs:
        if t.transaction_type == "expense":
            cname = t.category.name if t.category else "Uncategorized"
            category_breakdown[cname] = category_breakdown.get(cname, 0.0) + t.amount

    category_breakdown_list = [
        {"name": k, "value": round(v, 2), "percentage": round((v / max(1.0, total_expenses)) * 100, 1)}
        for k, v in sorted(category_breakdown.items(), key=lambda x: x[1], reverse=True)
    ]

    # Goals
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    goals_summary = []
    for g in goals:
        pct = round((g.current_amount / max(1.0, g.target_amount)) * 100, 1)
        goals_summary.append({
            "id": g.id,
            "name": g.name,
            "target": g.target_amount,
            "current": g.current_amount,
            "progress_pct": pct,
            "deadline": g.deadline.strftime("%Y-%m-%d")
        })

    # Upcoming Bills (next 14 days)
    bills = (
        db.query(RecurringBill)
        .filter(RecurringBill.user_id == current_user.id, RecurringBill.status == "active")
        .all()
    )
    upcoming_bills = []
    for b in bills:
        days_due = (b.next_due_date - today).days
        if 0 <= days_due <= 14:
            upcoming_bills.append({
                "id": b.id,
                "name": b.name,
                "amount": b.amount,
                "due_date": b.next_due_date.strftime("%Y-%m-%d"),
                "days_remaining": days_due,
                "provider": b.provider or "Provider"
            })
    upcoming_bills.sort(key=lambda x: x["days_remaining"])

    # Recent Anomalies
    anomalies = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id, Transaction.is_anomaly == True)
        .order_by(Transaction.date.desc())
        .limit(5)
        .all()
    )
    anomalies_list = [
        {
            "id": a.id,
            "description": a.description,
            "amount": a.amount,
            "date": a.date.strftime("%Y-%m-%d"),
            "category": a.category.name if a.category else "General",
            "anomaly_score": a.anomaly_score,
            "reason": a.anomaly_reason
        }
        for a in anomalies
    ]

    # Historical monthly income vs expense chart (past 6 months)
    history_chart = []
    for m_back in range(5, -1, -1):
        m_start = (today.replace(day=1) - timedelta(days=m_back * 30)).replace(day=1)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        m_label = m_start.strftime("%b %Y")
        
        m_txs = (
            db.query(Transaction)
            .filter(Transaction.user_id == current_user.id, Transaction.date >= m_start, Transaction.date < m_end)
            .all()
        )
        m_inc = sum(t.amount for t in m_txs if t.transaction_type == "income")
        if m_inc == 0:
            m_inc = current_user.monthly_income or 125000.0
        m_exp = sum(t.amount for t in m_txs if t.transaction_type == "expense")
        history_chart.append({
            "month": m_label,
            "income": round(m_inc, 2),
            "expense": round(m_exp, 2),
            "savings": round(max(0.0, m_inc - m_exp), 2)
        })

    # Recent 6 transactions
    recent_txs = [
        {
            "id": t.id,
            "description": t.description,
            "amount": t.amount,
            "type": t.transaction_type,
            "date": t.date.strftime("%Y-%m-%d"),
            "category": t.category.name if t.category else "General",
            "merchant": t.merchant or "",
            "is_anomaly": t.is_anomaly
        }
        for t in current_txs[:6]
    ]

    # Run PEAS Agent for Prioritized Recommendations & Forecast
    peas_result = peas_agent.inspect_and_orchestrate(db, current_user)

    return {
        "period": start_date.strftime("%B %Y"),
        "currency": current_user.currency or "INR",
        "currency_symbol": "₹",
        "liquid_balance": round(total_balance, 2),
        "total_income": round(total_income, 2),
        "total_expenses": round(total_expenses, 2),
        "net_savings": round(net_savings, 2),
        "savings_rate_pct": savings_rate,
        "expense_delta_pct": expense_delta_pct,
        "budget_limit": round(total_budget_limit, 2),
        "budget_utilization_pct": budget_utilization,
        "month_end_forecast": peas_result["environment_state"]["anfis_closing_balance_forecast"],
        "category_breakdown": category_breakdown_list,
        "goals": goals_summary,
        "upcoming_bills": upcoming_bills,
        "recent_anomalies": anomalies_list,
        "income_vs_expense_history": history_chart,
        "recent_transactions": recent_txs,
        "recommendations": peas_result["actuator_proposals"]
    }
