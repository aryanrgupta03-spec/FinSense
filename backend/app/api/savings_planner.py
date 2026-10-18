from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict, Any, List, Optional

from app.database import get_db
from app.models.user import User
from app.models.finance import Goal, Budget, Category, Transaction, RecurringBill
from app.models.intelligence import OptimizationScenario
from app.schemas.intelligence import AStarPlanRequest, AStarPlanResponse, DependencyGraphResponse, ImpactAnalysisRequest, ImpactAnalysisResponse
from app.api.deps import get_current_user
from app.services.astar_search import astar_optimizer
from app.services.dependency_graph import build_default_dependency_graph

router = APIRouter(prefix="/savings-planner", tags=["Savings Planner & Optimization"])

@router.post("/optimize", response_model=AStarPlanResponse)
def run_astar_optimization(
    req: AStarPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goal = db.query(Goal).filter(Goal.id == req.goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    today = date.today()
    if req.override_deadline_months:
        months_remaining = max(1, req.override_deadline_months)
    else:
        months_remaining = max(1, (goal.deadline.year - today.year) * 12 + (goal.deadline.month - today.month))

    target_amt = req.override_target_amount if req.override_target_amount is not None else goal.target_amount

    # Collect categories and spending allocations
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    categories_data = []

    for b in budgets:
        cat = b.category
        if not cat:
            continue
        # Get spending this month
        first_of_month = date(today.year, today.month, 1)
        spent_txs = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == cat.id,
                Transaction.date >= first_of_month,
                Transaction.transaction_type == "expense"
            )
            .all()
        )
        spent = sum(t.amount for t in spent_txs)
        current_val = max(spent, b.limit_amount)

        # Floor limit: essentials have high floor (cannot cut); discretionary can cut down to 30%
        floor = current_val * 0.9 if cat.is_essential else current_val * 0.35

        categories_data.append({
            "id": cat.id,
            "name": cat.name,
            "current_spend": current_val,
            "floor_limit": floor,
            "flexibility_score": cat.flexibility_score if not cat.is_essential else 0.05,
            "is_essential": cat.is_essential
        })

    # Execute A* Search
    income = current_user.monthly_income or 125000.0
    total_curr_spend = sum(c["current_spend"] for c in categories_data)
    curr_surplus = max(0.0, income - total_curr_spend)

    plan = astar_optimizer.search_optimal_plan(
        goal_name=goal.name,
        target_amount=target_amt,
        current_saved=goal.current_amount,
        months_remaining=months_remaining,
        current_monthly_income=income,
        current_baseline_surplus=curr_surplus,
        categories=categories_data,
        strict_mode=req.strict_mode or False
    )

    # Persist scenario record
    scenario_record = OptimizationScenario(
        user_id=current_user.id,
        goal_id=goal.id,
        target_amount=target_amt,
        deadline=f"{months_remaining} months",
        search_algorithm="A* (Heuristic Search)",
        is_feasible=plan["is_feasible"],
        total_monthly_savings_achieved=plan["total_monthly_savings_unlocked"],
        heuristic_cost=plan["inconvenience_path_cost"],
        steps_json=plan["reduction_steps"],
        rationale=plan["feasibility_notes"]
    )
    db.add(scenario_record)
    db.commit()

    return plan

@router.get("/dependency-graph", response_model=DependencyGraphResponse)
def get_dependency_graph(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = current_user.monthly_income or 125000.0

    # Categorize budgets
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    essentials = []
    discretionary = []
    for b in budgets:
        c = b.category
        if c and c.is_essential:
            essentials.append({"label": c.name, "amount": b.limit_amount})
        elif c:
            discretionary.append({"label": c.name, "amount": b.limit_amount})

    bills = db.query(RecurringBill).filter(RecurringBill.user_id == current_user.id, RecurringBill.status == "active").all()
    bill_items = [{"label": b.name, "amount": b.amount} for b in bills]

    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    goal_items = [{"label": g.name, "amount": 10000.0} for g in goals]

    graph = build_default_dependency_graph(
        monthly_income=income,
        essential_expenses=essentials,
        discretionary_expenses=discretionary,
        recurring_bills=bill_items,
        goals=goal_items
    )

    return graph.to_graph_response()

@router.post("/dependency-graph/simulate-impact", response_model=ImpactAnalysisResponse)
def simulate_dependency_impact(
    req: ImpactAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    income = current_user.monthly_income or 125000.0
    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    essentials = [{"label": b.category.name, "amount": b.limit_amount} for b in budgets if b.category and b.category.is_essential]
    discretionary = [{"label": b.category.name, "amount": b.limit_amount} for b in budgets if b.category and not b.category.is_essential]
    bills = [{"label": b.name, "amount": b.amount} for b in db.query(RecurringBill).filter(RecurringBill.user_id == current_user.id).all()]
    goals = [{"label": g.name, "amount": 10000.0} for g in db.query(Goal).filter(Goal.user_id == current_user.id).all()]

    graph = build_default_dependency_graph(income, essentials, discretionary, bills, goals)
    impact = graph.bfs_impact_analysis(req.altered_node_id, req.amount_change_percentage)
    return impact
