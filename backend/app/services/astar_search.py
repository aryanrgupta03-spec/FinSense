"""
A* Goal-Based Budget Search Optimizer
Heuristic state-space search finding the optimal, minimum-inconvenience expense
reduction strategy to fulfill a user's savings goal by a strict deadline.
"""

import heapq
from typing import List, Dict, Any, Tuple, Optional

class AStarBudgetNode:
    def __init__(
        self,
        allocations: Dict[int, float],  # {category_id: current_spend}
        g_cost: float,                   # Cumulative inconvenience cost
        h_cost: float,                   # Heuristic estimated gap
        parent: Optional['AStarBudgetNode'] = None,
        action_step: Optional[Dict[str, Any]] = None
    ):
        self.allocations = allocations
        self.g_cost = g_cost
        self.h_cost = h_cost
        self.f_cost = g_cost + h_cost
        self.parent = parent
        self.action_step = action_step

    def __lt__(self, other: 'AStarBudgetNode') -> bool:
        return self.f_cost < other.f_cost

class AStarBudgetOptimizer:
    """
    Formulation:
    - State: Current monthly spending allocation across all budget categories {category_id: spend}
    - Transitions: Applying a stepped reduction (e.g. 10% or 15%) to an eligible category above its floor
    - Path Cost g(n): Cumulative inconvenience penalty:
        g += (reduction_amount / original_spend) * (1.0 / max(0.1, flexibility_score))
      Cutting essential/inflexible categories incurs heavy penalties; cutting high-flexibility costs very little.
    - Heuristic h(n): Admissible remaining savings shortfall:
        h(n) = max(0.0, (required_surplus - current_surplus)) / (average_max_flexibility * 1000.0)
    """

    def __init__(self):
        pass

    def search_optimal_plan(
        self,
        goal_name: str,
        target_amount: float,
        current_saved: float,
        months_remaining: int,
        current_monthly_income: float,
        current_baseline_surplus: float,
        categories: List[Dict[str, Any]],  # [{id, name, current_spend, floor_limit, flexibility, is_essential}]
        strict_mode: bool = False
    ) -> Dict[str, Any]:
        # Handle zero or negative months
        months_remaining = max(1, months_remaining)
        needed_total = max(0.0, target_amount - current_saved)
        required_monthly_savings = round(needed_total / months_remaining, 2)
        initial_shortfall = max(0.0, required_monthly_savings - current_baseline_surplus)

        # If already saving enough, goal is already satisfied!
        if initial_shortfall <= 0.0:
            return {
                "goal_name": goal_name,
                "target_amount": target_amount,
                "current_saved": current_saved,
                "months_remaining": months_remaining,
                "required_monthly_savings": required_monthly_savings,
                "current_monthly_surplus": current_baseline_surplus,
                "is_feasible": True,
                "total_monthly_savings_unlocked": 0.0,
                "new_monthly_surplus": current_baseline_surplus,
                "inconvenience_path_cost": 0.0,
                "heuristic_gap": 0.0,
                "reduction_steps": [],
                "feasibility_notes": f"Goal '{goal_name}' is already on track. Current monthly surplus of ₹{current_baseline_surplus:,.2f} exceeds required savings of ₹{required_monthly_savings:,.2f}/mo."
            }

        # Setup initial state
        initial_allocations = {c["id"]: float(c["current_spend"]) for c in categories}
        cat_map = {c["id"]: c for c in categories}

        # Calculate maximum possible savings achievable across all categories
        max_possible_savings = 0.0
        for c in categories:
            if not c["is_essential"]:
                floor = float(c.get("floor_limit", c["current_spend"] * 0.3))
                max_possible_savings += max(0.0, float(c["current_spend"]) - floor)

        # Check total theoretical feasibility
        if (current_baseline_surplus + max_possible_savings) < required_monthly_savings:
            shortfall = required_monthly_savings - (current_baseline_surplus + max_possible_savings)
            # Offer practical alternatives: extend deadline or adjust target
            alt_months = int(round(needed_total / max(100.0, current_baseline_surplus + max_possible_savings)))
            alt_target = round((current_baseline_surplus + max_possible_savings) * months_remaining + current_saved, 2)

            return {
                "goal_name": goal_name,
                "target_amount": target_amount,
                "current_saved": current_saved,
                "months_remaining": months_remaining,
                "required_monthly_savings": required_monthly_savings,
                "current_monthly_surplus": current_baseline_surplus,
                "is_feasible": False,
                "total_monthly_savings_unlocked": round(max_possible_savings, 2),
                "new_monthly_surplus": round(current_baseline_surplus + max_possible_savings, 2),
                "inconvenience_path_cost": 999.0,
                "heuristic_gap": round(shortfall, 2),
                "reduction_steps": [],
                "feasibility_notes": (
                    f"A* search determined target is unfeasible under current budget floors. "
                    f"Maximum achievable monthly surplus is ₹{current_baseline_surplus + max_possible_savings:,.2f}, leaving a shortfall of ₹{shortfall:,.2f}/mo."
                ),
                "alternative_options": [
                    {
                        "type": "extend_deadline",
                        "label": f"Extend deadline from {months_remaining} to {alt_months} months",
                        "new_months": alt_months,
                        "achievable_savings_monthly": round(current_baseline_surplus + max_possible_savings, 2)
                    },
                    {
                        "type": "adjust_target",
                        "label": f"Adjust target amount to ₹{alt_target:,.2f} within same {months_remaining} months",
                        "new_target": alt_target
                    }
                ]
            }

        # A* Search Priority Queue
        # State: AStarBudgetNode
        start_node = AStarBudgetNode(
            allocations=dict(initial_allocations),
            g_cost=0.0,
            h_cost=self._calc_heuristic(initial_shortfall)
        )

        open_set: List[AStarBudgetNode] = []
        heapq.heappush(open_set, start_node)
        closed_set = set()

        goal_node: Optional[AStarBudgetNode] = None
        max_iterations = 800
        iterations = 0

        while open_set and iterations < max_iterations:
            iterations += 1
            curr_node = heapq.heappop(open_set)

            # Check total savings unlocked in this node
            current_total_savings = sum(
                initial_allocations[cid] - curr_node.allocations[cid]
                for cid in initial_allocations
            )

            # Goal test: does current savings cover the required shortfall?
            if current_total_savings >= initial_shortfall:
                goal_node = curr_node
                break

            # State hash for closed set
            state_key = tuple(sorted((cid, round(amt, 1)) for cid, amt in curr_node.allocations.items()))
            if state_key in closed_set:
                continue
            closed_set.add(state_key)

            # Generate successor actions: iterate over flexible categories
            for cid, curr_spend in curr_node.allocations.items():
                cat_info = cat_map[cid]
                if cat_info["is_essential"]:
                    continue  # Do not touch essential categories

                floor = float(cat_info.get("floor_limit", cat_info["current_spend"] * 0.3))
                available_to_cut = curr_spend - floor
                if available_to_cut <= 10.0:
                    continue

                # Stepped reduction: cut 15% of initial spend or remaining available
                cut_step = min(available_to_cut, initial_allocations[cid] * 0.15)
                new_spend = round(curr_spend - cut_step, 2)

                # Inconvenience calculation: inversely proportional to flexibility
                flexibility = float(cat_info.get("flexibility_score", 0.5))
                step_inconvenience = (cut_step / initial_allocations[cid]) * (1.0 / max(0.1, flexibility))

                new_allocations = dict(curr_node.allocations)
                new_allocations[cid] = new_spend

                new_g = curr_node.g_cost + step_inconvenience
                new_unlocked = sum(initial_allocations[k] - new_allocations[k] for k in initial_allocations)
                remaining_gap = max(0.0, initial_shortfall - new_unlocked)
                new_h = self._calc_heuristic(remaining_gap)

                action_step = {
                    "category_id": cid,
                    "category_name": cat_info["name"],
                    "current_spend": initial_allocations[cid],
                    "proposed_spend": new_spend,
                    "reduction_amount": round(initial_allocations[cid] - new_spend, 2),
                    "reduction_percentage": round(((initial_allocations[cid] - new_spend) / initial_allocations[cid]) * 100, 1),
                    "inconvenience_weight": round(step_inconvenience, 3),
                    "rationale": f"Reduced flexible spending in {cat_info['name']} by ₹{cut_step:,.2f} (Flexibility: {flexibility * 100:.0f}%)."
                }

                successor = AStarBudgetNode(
                    allocations=new_allocations,
                    g_cost=new_g,
                    h_cost=new_h,
                    parent=curr_node,
                    action_step=action_step
                )
                heapq.heappush(open_set, successor)

        # Reconstruct path
        final_steps: List[Dict[str, Any]] = []
        if goal_node:
            # Consolidate per category
            cat_consolidated: Dict[int, Dict[str, Any]] = {}
            temp = goal_node
            while temp and temp.action_step:
                cid = temp.action_step["category_id"]
                if cid not in cat_consolidated:
                    cat_consolidated[cid] = dict(temp.action_step)
                else:
                    # Update lowest spend
                    cat_consolidated[cid]["proposed_spend"] = min(cat_consolidated[cid]["proposed_spend"], temp.action_step["proposed_spend"])
                    orig = cat_consolidated[cid]["current_spend"]
                    prop = cat_consolidated[cid]["proposed_spend"]
                    cat_consolidated[cid]["reduction_amount"] = round(orig - prop, 2)
                    cat_consolidated[cid]["reduction_percentage"] = round(((orig - prop) / orig) * 100, 1)
                temp = temp.parent

            final_steps = list(cat_consolidated.values())

        total_unlocked = sum(s["reduction_amount"] for s in final_steps)
        new_surplus = round(current_baseline_surplus + total_unlocked, 2)

        return {
            "goal_name": goal_name,
            "target_amount": target_amount,
            "current_saved": current_saved,
            "months_remaining": months_remaining,
            "required_monthly_savings": required_monthly_savings,
            "current_monthly_surplus": current_baseline_surplus,
            "is_feasible": True,
            "total_monthly_savings_unlocked": round(total_unlocked, 2),
            "new_monthly_surplus": new_surplus,
            "inconvenience_path_cost": round(goal_node.g_cost if goal_node else 0.0, 3),
            "heuristic_gap": 0.0,
            "reduction_steps": final_steps,
            "feasibility_notes": (
                f"A* successfully generated a minimal-inconvenience reduction strategy unlocking ₹{total_unlocked:,.2f}/mo. "
                f"Your adjusted monthly surplus will be ₹{new_surplus:,.2f}, enabling completion of '{goal_name}' within {months_remaining} months."
            )
        }

    def _calc_heuristic(self, remaining_gap: float) -> float:
        # Admissible heuristic: minimal inconvenience to cover remaining gap
        return round(remaining_gap / 10000.0, 4)

astar_optimizer = AStarBudgetOptimizer()
