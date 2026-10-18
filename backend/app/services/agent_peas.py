"""
PEAS Intelligent Financial Agent Architecture
Orchestrates multi-sensor financial observation, multi-technique analytical reasoning,
and actuator recommendation dispatching without unauthorized money movement.
"""

from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.finance import Account, Transaction, Budget, Goal, RecurringBill
from app.models.user import User
from app.services.prolog_engine import prolog_engine
from app.services.fuzzy_controller import fuzzy_spending_controller
from app.services.investment_readiness import investment_readiness_engine
from app.services.anfis_forecast import anfis_forecaster
from app.services.astar_search import astar_optimizer
from app.services.minimax_simulator import minimax_simulator

class PEASFinancialAgent:
    """
    PEAS Architecture Specification:
      - Performance Measures:
          * Monthly savings rate (% of net income)
          * Budget variance / overrun minimization
          * Forecast accuracy (ANFIS MAE <= ₹1500)
          * Accurate anomaly detection with minimal false positives
          * User-actionable cost reductions identified (INR)
      - Environment:
          * Personal bank accounts & liquid ledger balances
          * Multi-category transactions and historical spending
          * User budget caps and goal deadlines
          * Recurring bills, provider contracts, and subscription fees
      - Sensors:
          * Ingested transaction feeds & manual ledger entries
          * CSV statement batch imports
          * Receipt uploads & categorizer feedback
          * User profile inputs (stated salary, target deadlines)
      - Actuators:
          * Priority UI notifications & alerts
          * Auto-categorization assignments
          * Actionable scenario recommendations (A* budget plans, Minimax negotiation scripts)
          * User-authorized action prompts (explicit confirmation required)
    """

    def __init__(self):
        pass

    def inspect_and_orchestrate(self, db: Session, user: User) -> Dict[str, Any]:
        """
        Gathers sensor data, runs analytical intelligence modules, evaluates performance,
        and generates prioritized actuator recommendations.
        """
        # -------------------------------------------------------------
        # 1. SENSOR INGESTION & ENVIRONMENT STATE EXTRACTION
        # -------------------------------------------------------------
        accounts = db.query(Account).filter(Account.user_id == user.id).all()
        total_balance = sum(a.balance for a in accounts)

        # Current period (e.g. current month)
        today = date.today()
        month_str = today.strftime("%Y-%m")
        days_in_month = 30
        days_passed = today.day
        days_remaining = max(1, days_in_month - days_passed)

        # Transactions for this month
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == user.id)
            .filter(Transaction.date >= date(today.year, today.month, 1))
            .all()
        )
        total_income = sum(t.amount for t in transactions if t.transaction_type == "income")
        total_expenses = sum(t.amount for t in transactions if t.transaction_type == "expense")
        avg_daily_spend = round(total_expenses / max(1, days_passed), 2)

        # Budgets
        budgets = db.query(Budget).filter(Budget.user_id == user.id).all()
        budget_items = []
        total_budget_limit = 0.0
        for b in budgets:
            cat_spent = sum(t.amount for t in transactions if t.category_id == b.category_id and t.transaction_type == "expense")
            budget_items.append({
                "category": b.category.name if b.category else f"Cat-{b.category_id}",
                "spent": cat_spent,
                "limit": b.limit_amount
            })
            total_budget_limit += b.limit_amount

        # Recurring Bills
        bills = db.query(RecurringBill).filter(RecurringBill.user_id == user.id, RecurringBill.status == "active").all()
        bill_items = []
        upcoming_fixed_bills = 0.0
        for bill in bills:
            days_due = (bill.next_due_date - today).days
            bill_items.append({
                "name": bill.name,
                "amount": bill.amount,
                "days_remaining": max(0, days_due)
            })
            if 0 <= days_due <= days_remaining:
                upcoming_fixed_bills += bill.amount

        # Goals
        goals = db.query(Goal).filter(Goal.user_id == user.id).all()
        goal_items = []
        total_target_savings = sum(g.target_amount for g in goals)
        total_current_saved = sum(g.current_amount for g in goals)
        for g in goals:
            months_left = max(1, (g.deadline.year - today.year) * 12 + (g.deadline.month - today.month))
            needed_mo = max(0.0, (g.target_amount - g.current_amount) / months_left)
            goal_items.append({
                "name": g.name,
                "target": g.target_amount,
                "current": g.current_amount,
                "needed_monthly": needed_mo
            })

        # Calculate burn rate & emergency coverage
        monthly_income = user.monthly_income or 125000.0
        expected_monthly_essential = (total_budget_limit * 0.5) + upcoming_fixed_bills
        emergency_months = round(total_balance / max(1000.0, expected_monthly_essential), 1)
        pro_rata_expected = (total_budget_limit * (days_passed / days_in_month)) if total_budget_limit > 0 else 1.0
        burn_rate = round(total_expenses / max(1.0, pro_rata_expected), 2)
        overall_goal_pct = round((total_current_saved / max(1.0, total_target_savings)) * 100.0, 1) if total_target_savings > 0 else 50.0
        current_surplus = max(0.0, monthly_income - total_expenses)

        # -------------------------------------------------------------
        # 2. ANALYTIC SUB-SYSTEM EVALUATION
        # -------------------------------------------------------------
        # Technique 2: Prolog Reasoning
        prolog_audit = prolog_engine.audit_financial_state(
            budgets=budget_items,
            bills=bill_items,
            emergency_reserve=total_balance,
            monthly_essential_burn=expected_monthly_essential,
            goals=goal_items,
            monthly_surplus=current_surplus
        )

        # Technique 6: Fuzzy Spending Controller
        fuzzy_alert = fuzzy_spending_controller.evaluate(
            burn_rate=burn_rate,
            days_remaining=days_remaining,
            goal_progress=overall_goal_pct
        )

        # Technique 7: Investment Readiness FIS
        invest_readiness = investment_readiness_engine.evaluate(
            emergency_coverage_months=emergency_months,
            expense_stability_score=78.0,
            goal_progress_pct=overall_goal_pct,
            monthly_surplus_inr=current_surplus
        )

        # Technique 8: ANFIS Cash-Flow Forecast
        anfis_res = anfis_forecaster.generate_forecast(
            current_balance=total_balance,
            average_daily_spend=avg_daily_spend,
            upcoming_fixed_bills=upcoming_fixed_bills,
            expected_salary_inflow=monthly_income if days_remaining <= 5 else 0.0,
            days_remaining_in_month=days_remaining
        )

        # -------------------------------------------------------------
        # 3. ACTUATOR RECOMMENDATION SYNTHESIS & RANKING
        # -------------------------------------------------------------
        recommendations: List[Dict[str, Any]] = []

        # From Prolog Audit: Critical Violations
        for finding in prolog_audit["findings"]:
            if finding["rule_type"] == "budget_violation":
                cat = finding["fact_details"].get("category", "Category")
                overrun = finding["fact_details"].get("overrun", 0.0)
                recommendations.append({
                    "id": f"rec-prolog-overrun-{cat}",
                    "priority": 1,
                    "title": f"Cap Budget Breach: {cat}",
                    "category": cat,
                    "action_type": "budget_cut",
                    "estimated_monthly_savings": round(overrun, 2),
                    "confidence_score": 0.98,
                    "rationale": finding["inferred_explanation"],
                    "suggested_action_url": "/savings-planner"
                })
            elif finding["rule_type"] == "emergency_fund_risk":
                shortfall = finding["fact_details"].get("shortfall", 0.0)
                recommendations.append({
                    "id": "rec-prolog-emergency-reserve",
                    "priority": 2,
                    "title": "Boost Emergency Reserve Cushion",
                    "category": "Savings",
                    "action_type": "emergency_boost",
                    "estimated_monthly_savings": round(shortfall * 0.2, 2),
                    "confidence_score": 0.95,
                    "rationale": finding["inferred_explanation"],
                    "suggested_action_url": "/goals"
                })

        # From Fuzzy Alert: Spending Risk
        if fuzzy_alert["status"] in ["High Risk", "Spending Freeze Recommended"]:
            recommendations.append({
                "id": "rec-fuzzy-burn-control",
                "priority": 1 if fuzzy_alert["status"] == "Spending Freeze Recommended" else 2,
                "title": f"Pacing Alert: {fuzzy_alert['status']}",
                "category": "Discretionary",
                "action_type": "budget_cut",
                "estimated_monthly_savings": round(avg_daily_spend * 0.3 * days_remaining, 2),
                "confidence_score": 0.92,
                "rationale": f"Current burn rate is {burn_rate:.2f}x expected speed with {days_remaining} days left. Reducing discretionary outings preserves liquidity.",
                "suggested_action_url": "/budgets"
            })

        # From Minimax: Renegotiable Bills
        for bill in bills:
            if bill.negotiable and bill.amount >= 1000.0:
                sim = minimax_simulator.simulate(bill.name, bill.provider or "Provider", bill.amount)
                if sim["estimated_annual_savings"] > 1000.0:
                    recommendations.append({
                        "id": f"rec-minimax-{bill.id}",
                        "priority": 3,
                        "title": f"Renegotiate {bill.name} Subscription",
                        "category": "Bills",
                        "action_type": "bill_renegotiation",
                        "estimated_monthly_savings": round(sim["estimated_annual_savings"] / 12.0, 2),
                        "confidence_score": 0.88,
                        "rationale": f"Minimax game-tree analysis indicates retention negotiation could yield ₹{sim['estimated_annual_savings']:,.0f}/yr savings.",
                        "suggested_action_url": "/bills"
                    })
                    break  # Avoid flood

        # From Investment Readiness FIS: Sugeno Deployable Capital
        if invest_readiness["sugeno_investable_surplus"] > 3000.0 and invest_readiness["mamdani_status"] in ["Moderate", "Highly Ready"]:
            recommendations.append({
                "id": "rec-sugeno-sip-allocation",
                "priority": 4,
                "title": "Deploy Safe Investable Surplus to SIP",
                "category": "Investments",
                "action_type": "investment_opportunity",
                "estimated_monthly_savings": invest_readiness["sugeno_investable_surplus"],
                "confidence_score": 0.89,
                "rationale": f"Sugeno FIS identified ₹{invest_readiness['sugeno_investable_surplus']:,.2f}/mo as safely investable surplus after liquidity buffers.",
                "suggested_action_url": "/investment-readiness"
            })

        # Sort recommendations by priority (1 is highest)
        recommendations.sort(key=lambda x: x["priority"])

        # -------------------------------------------------------------
        # 4. COMPOSE PEAS RESPONSE
        # -------------------------------------------------------------
        return {
            "timestamp": datetime.utcnow(),
            "performance_metrics": {
                "current_savings_rate_pct": round((current_surplus / monthly_income) * 100, 1),
                "budget_utilization_pct": round((total_expenses / max(1.0, total_budget_limit)) * 100, 1),
                "anfis_forecast_error_mae": anfis_res["mae"],
                "total_actionable_savings_inr": sum(r["estimated_monthly_savings"] for r in recommendations)
            },
            "environment_state": {
                "liquid_balance": total_balance,
                "monthly_income": monthly_income,
                "total_expenses": total_expenses,
                "emergency_coverage_months": emergency_months,
                "fuzzy_spending_status": fuzzy_alert["status"],
                "anfis_closing_balance_forecast": anfis_res["anfis_predicted_closing_balance"],
                "days_remaining_in_month": days_remaining
            },
            "sensor_inputs": {
                "active_accounts_count": len(accounts),
                "transactions_processed_this_month": len(transactions),
                "budgets_monitored": len(budgets),
                "recurring_bills_tracked": len(bills),
                "active_goals_count": len(goals)
            },
            "actuator_proposals": recommendations
        }

peas_agent = PEASFinancialAgent()
