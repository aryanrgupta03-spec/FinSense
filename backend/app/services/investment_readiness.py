"""
Investment Readiness Dual Fuzzy Inference System:
Mamdani FIS (Linguistic Readiness Classification) vs.
Sugeno FIS (Crisp Numeric Investable Surplus Calculation).
"""

from typing import Dict, List, Any, Tuple
from app.services.fuzzy_controller import trimf, trapmf

class InvestmentReadinessEngine:
    """
    Common Inputs:
      1. emergency_coverage (months): Liquid reserves / monthly mandatory commitments [0 to 12 months]
      2. expense_stability (score 0-100): Inverse coefficient of variation of monthly expenses [0=volatile, 100=highly stable]
      3. goal_progress (%): Aggregate goal completion [0 to 100%]
      4. monthly_surplus (INR): Net available surplus after all essential & recurring expenses
    """

    def __init__(self):
        pass

    def evaluate(
        self,
        emergency_coverage_months: float,
        expense_stability_score: float,
        goal_progress_pct: float,
        monthly_surplus_inr: float
    ) -> Dict[str, Any]:
        # Clip inputs
        ef = max(0.0, min(12.0, float(emergency_coverage_months)))
        stab = max(0.0, min(100.0, float(expense_stability_score)))
        gp = max(0.0, min(100.0, float(goal_progress_pct)))
        surplus = max(0.0, float(monthly_surplus_inr))

        # -----------------------------------------------------------------
        # 1. FUZZIFICATION
        # -----------------------------------------------------------------
        # Emergency coverage: Low (< 2.5 mo), Adequate (2.0 to 5.5 mo), High (> 5.0 mo)
        mu_ef = {
            "low": trapmf(ef, 0.0, 0.0, 1.8, 2.8),
            "adequate": trimf(ef, 2.0, 4.0, 6.0),
            "high": trapmf(ef, 5.0, 6.5, 12.0, 12.0)
        }

        # Expense stability: Volatile, Moderate, Stable
        mu_stab = {
            "volatile": trapmf(stab, 0.0, 0.0, 30.0, 45.0),
            "moderate": trimf(stab, 35.0, 60.0, 80.0),
            "stable": trapmf(stab, 70.0, 85.0, 100.0, 100.0)
        }

        # Goal progress: Behind, Healthy, Exemplary
        mu_gp = {
            "behind": trapmf(gp, 0.0, 0.0, 30.0, 45.0),
            "healthy": trimf(gp, 35.0, 65.0, 85.0),
            "exemplary": trapmf(gp, 75.0, 90.0, 100.0, 100.0)
        }

        # Monthly surplus: Minimal (< 12k), Moderate (10k to 35k), Abundant (> 30k)
        mu_surplus = {
            "minimal": trapmf(surplus, 0.0, 0.0, 8000.0, 14000.0),
            "moderate": trimf(surplus, 10000.0, 25000.0, 40000.0),
            "abundant": trapmf(surplus, 32000.0, 45000.0, 1000000.0, 1000000.0)
        }

        # -----------------------------------------------------------------
        # 2. MAMDANI FIS (Linguistic Readiness Score & Classification)
        # -----------------------------------------------------------------
        # Rules mapping inputs -> readiness category {not_ready, emerging, moderate, highly_ready}
        mamdani_rules = [
            # Low EF rules: Priority is emergency reserves, NOT investing
            ("low", "volatile", "behind", "not_ready", "Low emergency fund and volatile spending preclude investing"),
            ("low", "moderate", "healthy", "not_ready", "Adequate cash reserves must precede market exposure"),
            ("low", "stable", "exemplary", "emerging", "Stable income allows modest micro-savings despite lower reserves"),

            # Adequate EF rules
            ("adequate", "volatile", "behind", "emerging", "Adequate reserves allow cautious entry once spending stabilizes"),
            ("adequate", "moderate", "healthy", "moderate", "Balanced foundations support systematic investment plans (SIP)"),
            ("adequate", "stable", "exemplary", "highly_ready", "Strong financial discipline with robust reserve foundation"),

            # High EF rules
            ("high", "volatile", "healthy", "moderate", "Substantial reserves provide strong risk cushion against cashflow volatility"),
            ("high", "moderate", "healthy", "highly_ready", "High reserves and healthy goals create prime investment posture"),
            ("high", "stable", "exemplary", "highly_ready", "Exemplary financial resilience enables aggressive wealth generation")
        ]

        mamdani_active_rules = []
        consequent_mamdani = {"not_ready": 0.0, "emerging": 0.0, "moderate": 0.0, "highly_ready": 0.0}

        for r_ef, r_stab, r_gp, r_out, desc in mamdani_rules:
            strength = min(mu_ef[r_ef], mu_stab[r_stab], mu_gp[r_gp])
            if strength > 0.01:
                consequent_mamdani[r_out] = max(consequent_mamdani[r_out], strength)
                mamdani_active_rules.append({
                    "rule": f"IF EF={r_ef.upper()} AND Stability={r_stab.upper()} AND Goal={r_gp.upper()} THEN Readiness={r_out.upper()}",
                    "strength": round(strength, 3),
                    "description": desc
                })

        # Defuzzification of Mamdani output via Centroid over [0, 100]
        numerator = 0.0
        denominator = 0.0
        for y in range(101):
            mu_nr = trapmf(float(y), 0.0, 0.0, 15.0, 32.0)
            mu_em = trimf(float(y), 24.0, 45.0, 62.0)
            mu_mo = trimf(float(y), 50.0, 70.0, 85.0)
            mu_hr = trapmf(float(y), 75.0, 88.0, 100.0, 100.0)

            mu_y = max(
                min(consequent_mamdani["not_ready"], mu_nr),
                min(consequent_mamdani["emerging"], mu_em),
                min(consequent_mamdani["moderate"], mu_mo),
                min(consequent_mamdani["highly_ready"], mu_hr)
            )
            numerator += float(y) * mu_y
            denominator += mu_y

        mamdani_score = round(numerator / denominator, 1) if denominator > 0 else 20.0

        if mamdani_score <= 30.0:
            mamdani_status = "Not Ready"
        elif mamdani_score <= 55.0:
            mamdani_status = "Emerging"
        elif mamdani_score <= 75.0:
            mamdani_status = "Moderate"
        else:
            mamdani_status = "Highly Ready"

        # -----------------------------------------------------------------
        # 3. SUGENO FIS (Numeric Crisp Investable Surplus Allocation)
        # -----------------------------------------------------------------
        # Sugeno output is a linear combination of surplus:
        # z_i = k_i * Available Surplus (where k_i is safety allocation factor)
        # High EF & Stable -> invest 60% of surplus
        # Moderate EF & Stable -> invest 40% of surplus
        # Emerging -> invest 20% of surplus
        # Low EF -> invest 0% of surplus (100% routed to emergency fund replenishment)
        sugeno_rules = [
            ("low", "minimal", 0.00, "Reserve deficit: 100% of surplus preserved for emergency fund"),
            ("low", "moderate", 0.05, "Reserve deficit: Minimal 5% token micro-SIP, 95% to reserves"),
            ("low", "abundant", 0.15, "Reserve deficit with abundant surplus: 15% SIP, 85% to emergency buffer"),
            ("adequate", "minimal", 0.20, "Adequate reserves with tight surplus: Conservative 20% allocation"),
            ("adequate", "moderate", 0.40, "Standard baseline: 40% of surplus deployed to systematic investments"),
            ("adequate", "abundant", 0.50, "Healthy surplus: 50% deployed to diversified assets"),
            ("high", "minimal", 0.35, "Secure reserves: 35% invested"),
            ("high", "moderate", 0.55, "Secure reserves and comfortable surplus: 55% invested"),
            ("high", "abundant", 0.65, "Peak financial readiness: 65% invested in wealth growth")
        ]

        sugeno_active_rules = []
        weighted_output_sum = 0.0
        total_rule_weight = 0.0

        for r_ef, r_surp, k_factor, desc in sugeno_rules:
            weight = min(mu_ef[r_ef], mu_surplus[r_surp])
            if weight > 0.01:
                z_crisp = k_factor * surplus
                weighted_output_sum += weight * z_crisp
                total_rule_weight += weight
                sugeno_active_rules.append({
                    "rule": f"IF EF={r_ef.upper()} AND Surplus={r_surp.upper()} THEN Investable = {int(k_factor*100)}% of Surplus",
                    "weight": round(weight, 3),
                    "allocated_crisp_inr": round(z_crisp, 2),
                    "description": desc
                })

        sugeno_investable_surplus = round(weighted_output_sum / total_rule_weight, 2) if total_rule_weight > 0 else 0.0
        # Hard constraint safety ceiling: Never exceed 70% of current monthly surplus
        safety_ceiling = round(surplus * 0.70, 2)
        sugeno_investable_surplus = min(sugeno_investable_surplus, safety_ceiling)

        # -----------------------------------------------------------------
        # 4. COMPARISON ANALYSIS & EXPLANATION
        # -----------------------------------------------------------------
        comparison_analysis = (
            f"Mamdani FIS yielded an interpretable readiness score of {mamdani_score}/100 ({mamdani_status}), "
            f"reflecting overall structural resilience. Concurrently, Sugeno FIS computed an exact actionable "
            f"investable surplus of ₹{sugeno_investable_surplus:,.2f}/month (representing {round((sugeno_investable_surplus/surplus)*100 if surplus > 0 else 0, 1)}% "
            f"of your ₹{surplus:,.2f} discretionary surplus) strictly bounded by a safety ceiling of ₹{safety_ceiling:,.2f} "
            f"to safeguard liquidity."
        )

        return {
            "inputs": {
                "emergency_coverage_months": ef,
                "expense_stability_score": stab,
                "goal_progress_pct": gp,
                "monthly_surplus_inr": surplus
            },
            "mamdani_readiness_score": mamdani_score,
            "mamdani_status": mamdani_status,
            "mamdani_active_rules": [r["rule"] for r in mamdani_active_rules[:5]],
            "mamdani_active_rules_detailed": mamdani_active_rules,
            "sugeno_investable_surplus": sugeno_investable_surplus,
            "sugeno_safety_ceiling": safety_ceiling,
            "sugeno_active_rules": [r["rule"] for r in sugeno_active_rules[:5]],
            "sugeno_active_rules_detailed": sugeno_active_rules,
            "comparison_analysis": comparison_analysis,
            "disclaimer": (
                "IMPORTANT: This readiness assessment is an algorithmic financial decision-support tool. "
                "It does NOT constitute regulated personal investment advice, a portfolio recommendation, "
                "or a guarantee of financial return. Consult a certified financial planner before deploying capital."
            )
        }

investment_readiness_engine = InvestmentReadinessEngine()
