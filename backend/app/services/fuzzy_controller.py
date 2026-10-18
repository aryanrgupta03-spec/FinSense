"""
Fuzzy Spending Alert Controller
Three-Input Fuzzy Inference System (Burn Rate, Days Remaining, Goal Progress)
Defuzzified via Center of Gravity (Centroid) to calculate Alert-Urgency Score (0-100)
and map into: Comfortable, Caution, High Risk, Spending Freeze Recommended.
"""

from typing import Dict, List, Any, Tuple

def trimf(x: float, a: float, b: float, c: float) -> float:
    """Triangular membership function."""
    if x <= a or x >= c:
        return 0.0
    if x == b:
        return 1.0
    if a < x < b:
        return (x - a) / (b - a)
    if b < x < c:
        return (c - x) / (c - b)
    return 0.0

def trapmf(x: float, a: float, b: float, c: float, d: float) -> float:
    """Trapezoidal membership function."""
    if x <= a or x >= d:
        return 0.0
    if b <= x <= c:
        return 1.0
    if a < x < b:
        return (x - a) / (b - a)
    if c < x < d:
        return (d - x) / (d - c)
    return 0.0

class FuzzySpendingAlertController:
    """
    Inputs:
      1. burn_rate (x1): Spent so far / Pro-rata expected spend [0.0 to 2.5]
         - Low: trapmf(0.0, 0.0, 0.6, 0.85)
         - Normal: trimf(0.75, 1.0, 1.2)
         - High: trimf(1.1, 1.35, 1.6)
         - Critical: trapmf(1.45, 1.7, 3.0, 3.0)
      2. days_remaining (x2): Days left in current calendar month [0 to 31]
         - Few: trapmf(0, 0, 5, 8)
         - Moderate: trimf(6, 15, 22)
         - Many: trapmf(18, 24, 31, 31)
      3. goal_progress (x3): Completion percentage of target savings [0 to 100%]
         - Behind: trapmf(0, 0, 25, 45)
         - On_Track: trimf(35, 60, 85)
         - Ahead: trapmf(75, 90, 100, 100)
    Output:
      alert_urgency (y): [0 to 100]
         - Low: trimf(0, 15, 30)
         - Moderate: trimf(25, 45, 65)
         - High: trimf(55, 75, 90)
         - Critical: trapmf(80, 95, 100, 100)
    """

    def evaluate(self, burn_rate: float, days_remaining: int, goal_progress: float) -> Dict[str, Any]:
        # Clip inputs to safe bounds
        burn_rate = max(0.0, min(3.0, float(burn_rate)))
        days_remaining = max(0, min(31, int(days_remaining)))
        goal_progress = max(0.0, min(100.0, float(goal_progress)))

        # 1. Fuzzification
        mu_burn = {
            "low": trapmf(burn_rate, 0.0, 0.0, 0.65, 0.85),
            "normal": trimf(burn_rate, 0.75, 1.0, 1.2),
            "high": trimf(burn_rate, 1.1, 1.35, 1.6),
            "critical": trapmf(burn_rate, 1.45, 1.75, 3.0, 3.0)
        }

        mu_days = {
            "few": trapmf(days_remaining, 0.0, 0.0, 4.0, 8.0),
            "moderate": trimf(days_remaining, 6.0, 15.0, 22.0),
            "many": trapmf(days_remaining, 18.0, 24.0, 31.0, 31.0)
        }

        mu_goals = {
            "behind": trapmf(goal_progress, 0.0, 0.0, 25.0, 45.0),
            "on_track": trimf(goal_progress, 35.0, 60.0, 85.0),
            "ahead": trapmf(goal_progress, 75.0, 90.0, 100.0, 100.0)
        }

        # 2. Rule Base Evaluation (Mamdani Min operator)
        rules = [
            # Critical Burn rules
            ("critical", "many", "behind", "critical", "Critical burn early in month while goal is lagging"),
            ("critical", "many", "on_track", "critical", "Critical burn early in month threatens month-end cashflow"),
            ("critical", "many", "ahead", "high", "Critical burn early in month mitigated slightly by ahead goal"),
            ("critical", "moderate", "behind", "critical", "Mid-month critical burn with goal deficit"),
            ("critical", "moderate", "on_track", "high", "Mid-month critical burn requires containment"),
            ("critical", "moderate", "ahead", "high", "Mid-month critical burn with healthy goal"),
            ("critical", "few", "behind", "high", "Late month critical burn with goal deficit"),
            ("critical", "few", "on_track", "high", "Late month critical burn nearing period end"),
            ("critical", "few", "ahead", "moderate", "Late month critical burn cushioned by goal buffer"),

            # High Burn rules
            ("high", "many", "behind", "critical", "High burn early in month with goal deficit"),
            ("high", "many", "on_track", "high", "High burn early in month risks budget breach"),
            ("high", "moderate", "behind", "high", "Mid-month high burn with lagging savings"),
            ("high", "moderate", "on_track", "moderate", "Mid-month high burn manageable with discipline"),
            ("high", "few", "behind", "high", "Late month high burn threatening goal contributions"),
            ("high", "few", "on_track", "moderate", "Late month high burn with comfortable goal"),

            # Normal Burn rules
            ("normal", "many", "behind", "moderate", "Normal burn but goal contributions behind schedule"),
            ("normal", "many", "on_track", "low", "Budget pacing and goal tracking within healthy envelope"),
            ("normal", "moderate", "on_track", "low", "Balanced mid-month spending and savings"),
            ("normal", "few", "on_track", "low", "Month ending with stable normal run rate"),
            ("normal", "few", "behind", "moderate", "Month ending normally but annual goal needs catch-up"),

            # Low Burn rules
            ("low", "many", "on_track", "low", "Frugal early spending and solid savings posture"),
            ("low", "moderate", "ahead", "low", "Exemplary financial pacing with surplus accumulation"),
            ("low", "few", "ahead", "low", "Comfortable closing balance with surplus savings potential")
        ]

        active_rule_firings: List[Dict[str, Any]] = []
        consequent_activations = {"low": 0.0, "moderate": 0.0, "high": 0.0, "critical": 0.0}

        for r_burn, r_days, r_goal, r_out, desc in rules:
            firing_strength = min(mu_burn[r_burn], mu_days[r_days], mu_goals[r_goal])
            if firing_strength > 0.01:
                consequent_activations[r_out] = max(consequent_activations[r_out], firing_strength)
                active_rule_firings.append({
                    "rule": f"IF Burn={r_burn.upper()} AND Days={r_days.upper()} AND Goal={r_goal.upper()} THEN Urgency={r_out.upper()}",
                    "strength": round(firing_strength, 3),
                    "description": desc
                })

        # Sort active rules by strength
        active_rule_firings.sort(key=lambda x: x["strength"], reverse=True)

        # 3. Defuzzification via Center of Gravity (Centroid)
        # Sample universe of discourse y from 0 to 100 in steps of 1
        num_points = 101
        numerator = 0.0
        denominator = 0.0

        for y in range(num_points):
            # Membership of y in output sets
            mu_out_low = trimf(float(y), 0.0, 15.0, 35.0)
            mu_out_mod = trimf(float(y), 25.0, 48.0, 70.0)
            mu_out_high = trimf(float(y), 60.0, 78.0, 92.0)
            mu_out_crit = trapmf(float(y), 80.0, 92.0, 100.0, 100.0)

            # Aggregate aggregated output membership mu(y) = max(min(rule_strength, mu_class(y)))
            mu_y = max(
                min(consequent_activations["low"], mu_out_low),
                min(consequent_activations["moderate"], mu_out_mod),
                min(consequent_activations["high"], mu_out_high),
                min(consequent_activations["critical"], mu_out_crit)
            )

            numerator += float(y) * mu_y
            denominator += mu_y

        urgency_score = round(numerator / denominator, 1) if denominator > 0 else 25.0

        # 4. Map to Linguistic Status
        if urgency_score <= 32.0:
            status = "Comfortable"
            explanation = "Spending burn rate is well contained. Cash reserves and goal contributions are on a sustainable path."
        elif urgency_score <= 58.0:
            status = "Caution"
            explanation = "Moderate spending pressure detected. Recommend reviewing discretionary outings to avoid late-month constraints."
        elif urgency_score <= 78.0:
            status = "High Risk"
            explanation = "Elevated burn rate exceeds pro-rata budget limits. Immediate curtailment of non-essential purchases required."
        else:
            status = "Spending Freeze Recommended"
            explanation = "Critical spending trajectory detected. Discretionary spending freeze recommended to protect fixed commitments."

        return {
            "burn_rate": burn_rate,
            "burn_rate_memberships": {k: round(v, 3) for k, v in mu_burn.items()},
            "days_remaining": days_remaining,
            "days_memberships": {k: round(v, 3) for k, v in mu_days.items()},
            "goal_progress": goal_progress,
            "goal_progress_memberships": {k: round(v, 3) for k, v in mu_goals.items()},
            "active_rules": [r["rule"] for r in active_rule_firings[:5]],
            "active_rules_detailed": active_rule_firings[:8],
            "urgency_score": urgency_score,
            "status": status,
            "explanation": explanation
        }

fuzzy_spending_controller = FuzzySpendingAlertController()
