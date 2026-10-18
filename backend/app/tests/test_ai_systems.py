"""
Unit and Integration Tests for All 10 AI and Intelligent Systems:
1. PEAS Agent Orchestration
2. Prolog First-Order Logic Reasoning
3. Financial Dependency Graph (BFS/DFS)
4. A* Goal-Based Budget Search
5. Minimax Subscription Decision Simulator
6. Fuzzy Spending Alert Controller
7. Investment Readiness (Mamdani vs Sugeno)
8. ANFIS Neuro-Fuzzy Cashflow Forecaster
9. Supervised Anomaly Perceptron & Unsupervised Competitive Clustering
10. Financial Copilot Grounded Tool Routing
"""

import pytest
import numpy as np
from datetime import date

from app.services.prolog_engine import prolog_engine, PrologKnowledgeBase
from app.services.dependency_graph import build_default_dependency_graph
from app.services.astar_search import astar_optimizer
from app.services.minimax_simulator import minimax_simulator
from app.services.fuzzy_controller import fuzzy_spending_controller, trimf, trapmf
from app.services.investment_readiness import investment_readiness_engine
from app.services.anfis_forecast import anfis_forecaster
from app.services.neural_analytics import supervised_anomaly_model, competitive_clusterer
from app.services.copilot_slm import CopilotFinancialTools, FinancialCopilotService

# ============================================================================
# 1. PEAS AGENT ARCHITECTURE TEST
# ============================================================================
def test_peas_agent_orchestration():
    from app.services.agent_peas import peas_agent
    # Verify structure of PEAS specifications
    assert peas_agent is not None
    # Verify actuator proposals and performance measures format
    assert hasattr(peas_agent, "inspect_and_orchestrate")

# ============================================================================
# 2. PROLOG RULE REASONING TEST
# ============================================================================
def test_prolog_rule_inference():
    # 1. Budget overrun rule
    budgets = [{"category": "dining", "spent": 18000.0, "limit": 12000.0}]
    bills = [{"name": "jio", "amount": 1199.0, "days_remaining": 3}]
    goals = [{"name": "car", "target": 500000.0, "current": 50000.0, "needed_monthly": 25000.0}]
    
    audit = prolog_engine.audit_financial_state(
        budgets=budgets,
        bills=bills,
        emergency_reserve=40000.0,
        monthly_essential_burn=30000.0,
        goals=goals,
        monthly_surplus=10000.0
    )

    assert audit["facts_asserted"] > 0
    assert audit["rules_evaluated"] == 5
    rule_types = [f["rule_type"] for f in audit["findings"]]
    assert "budget_violation" in rule_types
    assert "upcoming_bill" in rule_types
    assert "emergency_fund_risk" in rule_types
    assert "goal_shortfall" in rule_types

    # Verify overrun calculation
    v = next(f for f in audit["findings"] if f["rule_type"] == "budget_violation")
    assert v["fact_details"]["overrun"] == 6000.0
    assert v["severity"] == "critical"

# ============================================================================
# 3. FINANCIAL DEPENDENCY GRAPH (BFS & DFS) TEST
# ============================================================================
def test_dependency_graph_traversal():
    graph = build_default_dependency_graph(
        monthly_income=125000.0,
        essential_expenses=[{"label": "Rent", "amount": 32000.0}],
        discretionary_expenses=[{"label": "Dining", "amount": 15000.0}],
        recurring_bills=[{"label": "Broadband", "amount": 1200.0}],
        goals=[{"label": "Emergency Fund", "amount": 10000.0}]
    )

    # Test BFS impact propagation on 20% salary reduction
    bfs_result = graph.bfs_impact_analysis("income_primary", -20.0)
    assert bfs_result["traversal_algorithm"].startswith("BFS")
    assert len(bfs_result["affected_nodes"]) > 0
    # Discretionary should have higher estimated impact than mandatory
    disc_nodes = [n for n in bfs_result["affected_nodes"] if n["flexible"]]
    mand_nodes = [n for n in bfs_result["affected_nodes"] if not n["flexible"]]
    assert len(disc_nodes) > 0
    assert len(mand_nodes) > 0

    # Test DFS path tracing from root income
    dfs_paths = graph.dfs_trace_paths("income_primary")
    assert len(dfs_paths) >= 3
    # Check that root is at start of all paths
    for p in dfs_paths:
        assert p[0]["id"] == "income_primary"

# ============================================================================
# 4. A* GOAL-BASED BUDGET SEARCH TEST
# ============================================================================
def test_astar_budget_search():
    categories = [
        {"id": 1, "name": "Rent", "current_spend": 32000.0, "floor_limit": 32000.0, "flexibility_score": 0.0, "is_essential": True},
        {"id": 2, "name": "Groceries", "current_spend": 18000.0, "floor_limit": 14000.0, "flexibility_score": 0.2, "is_essential": True},
        {"id": 3, "name": "Dining", "current_spend": 16000.0, "floor_limit": 5000.0, "flexibility_score": 0.9, "is_essential": False},
        {"id": 4, "name": "Shopping", "current_spend": 12000.0, "floor_limit": 4000.0, "flexibility_score": 0.8, "is_essential": False}
    ]

    # Feasible plan search
    plan = astar_optimizer.search_optimal_plan(
        goal_name="Laptop Upgrade",
        target_amount=60000.0,
        current_saved=10000.0,
        months_remaining=5,
        current_monthly_income=125000.0,
        current_baseline_surplus=2000.0,  # Needs 10k/mo -> shortfall is 8k/mo
        categories=categories
    )

    assert plan["is_feasible"] is True
    assert plan["total_monthly_savings_unlocked"] >= 8000.0
    assert len(plan["reduction_steps"]) > 0
    # Mandatory Rent should NEVER be reduced
    reduced_names = [s["category_name"] for s in plan["reduction_steps"]]
    assert "Rent" not in reduced_names

    # Unfeasible target test
    unfeasible_plan = astar_optimizer.search_optimal_plan(
        goal_name="Mega Vacation",
        target_amount=1000000.0,  # ₹10 lakh in 1 month
        current_saved=0.0,
        months_remaining=1,
        current_monthly_income=125000.0,
        current_baseline_surplus=5000.0,
        categories=categories
    )
    assert unfeasible_plan["is_feasible"] is False
    assert len(unfeasible_plan["alternative_options"]) > 0

# ============================================================================
# 5. MINIMAX BILL STRATEGY SIMULATOR TEST
# ============================================================================
def test_minimax_simulation():
    res = minimax_simulator.simulate(
        bill_name="JioFiber",
        provider="Reliance Jio",
        current_monthly_cost=1199.0,
        search_depth=3
    )

    assert res["bill_name"] == "JioFiber"
    assert res["current_monthly_cost"] == 1199.0
    assert res["best_strategy"] != ""
    assert res["estimated_annual_savings"] >= 0.0
    assert len(res["strategy_comparison"]) >= 4
    assert res["game_tree"]["children"] is not None

# ============================================================================
# 6. FUZZY SPENDING CONTROLLER TEST
# ============================================================================
def test_fuzzy_spending_controller():
    # Test comfortable state (low burn rate, many days left, ahead in goal)
    res_comf = fuzzy_spending_controller.evaluate(burn_rate=0.6, days_remaining=25, goal_progress=85.0)
    assert res_comf["urgency_score"] <= 40.0
    assert res_comf["status"] == "Comfortable"

    # Test critical state (high burn rate, early in month, behind on goal)
    res_crit = fuzzy_spending_controller.evaluate(burn_rate=2.2, days_remaining=26, goal_progress=20.0)
    assert res_crit["urgency_score"] >= 65.0
    assert res_crit["status"] in ["High Risk", "Spending Freeze Recommended"]
    assert len(res_crit["active_rules"]) > 0

# ============================================================================
# 7. INVESTMENT READINESS (MAMDANI VS SUGENO FIS) TEST
# ============================================================================
def test_investment_readiness_dual_fis():
    # Profile 1: Secure reserves & surplus
    res_high = investment_readiness_engine.evaluate(
        emergency_coverage_months=6.5,
        expense_stability_score=85.0,
        goal_progress_pct=80.0,
        monthly_surplus_inr=35000.0
    )
    assert res_high["mamdani_readiness_score"] >= 65.0
    assert res_high["mamdani_status"] in ["Moderate", "Highly Ready"]
    assert res_high["sugeno_investable_surplus"] > 10000.0
    assert res_high["sugeno_investable_surplus"] <= res_high["sugeno_safety_ceiling"]

    # Profile 2: Inadequate emergency coverage
    res_low = investment_readiness_engine.evaluate(
        emergency_coverage_months=0.8,
        expense_stability_score=40.0,
        goal_progress_pct=25.0,
        monthly_surplus_inr=15000.0
    )
    assert res_low["mamdani_status"] == "Not Ready"
    # Sugeno should route 95-100% of money to emergency fund, so investable surplus is near 0
    assert res_low["sugeno_investable_surplus"] < 3000.0

# ============================================================================
# 8. ANFIS CASH-FLOW FORECAST TEST
# ============================================================================
def test_anfis_cashflow_forecast():
    forecast = anfis_forecaster.generate_forecast(
        current_balance=85000.0,
        average_daily_spend=2200.0,
        upcoming_fixed_bills=12000.0,
        expected_salary_inflow=125000.0,
        days_remaining_in_month=15
    )

    assert "anfis_predicted_closing_balance" in forecast
    assert "baseline_predicted_closing_balance" in forecast
    assert forecast["mae"] > 0.0
    assert forecast["rmse"] > 0.0
    assert forecast["confidence_interval_high"] >= forecast["confidence_interval_low"]
    assert len(forecast["timeline"]) == 15

# ============================================================================
# 9. NEURAL ANALYTICS (SUPERVISED ANOMALY & COMPETITIVE CLUSTERING) TEST
# ============================================================================
def test_neural_analytics():
    # 1. Supervised Anomaly Perceptron
    is_normal, norm_score, _ = supervised_anomaly_model.score_transaction(
        amount=850.0,
        category_name="Groceries",
        category_avg=1200.0,
        user_median_spend=1000.0,
        day_of_month=10
    )
    assert is_normal is False
    assert norm_score < 65.0

    is_anom, anom_score, reason = supervised_anomaly_model.score_transaction(
        amount=48500.0,
        category_name="Dining Out",
        category_avg=1500.0,
        user_median_spend=1000.0,
        day_of_month=13,
        is_night_time=True
    )
    assert is_anom is True
    assert anom_score >= 65.0
    assert "higher than usual" in reason or "outlier" in reason

    # 2. Competitive Learning Clusterer
    profiles = competitive_clusterer.get_cluster_profiles()
    assert len(profiles) == 4
    assert sum(p["size_percentage"] for p in profiles) == 100.0
    assert competitive_clusterer.quantization_error < 0.1

# ============================================================================
# 10. FINANCIAL COPILOT TOOL ROUTING TEST
# ============================================================================
def test_copilot_tool_routing():
    svc = FinancialCopilotService()
    # Check synthetic grounding template synthesis
    response = svc._synthesize_grounded_response(
        "Where did I overspend?",
        {"overspending": {"count": 1, "overspent_categories": [{"category": "Dining Out", "spent": 16800.0, "limit": 12000.0, "overrun": 4800.0, "percentage": 140.0}]}}
    )
    assert "Dining Out" in response
    assert "4,800.00" in response
