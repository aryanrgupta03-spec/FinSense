"""
Minimax Bill Strategy Simulator
Game-theoretic multi-round decision tree simulating User decisions (MAX)
against Service Provider retention counter-offers (MIN).
"""

from typing import List, Dict, Any, Optional

class MinimaxBillSimulator:
    """
    Players:
      1. User Agent (MAX):
         Actions:
           - "Retain Status Quo": Inconvenience 0, Savings 0
           - "Downgrade Plan": Lower tier/speed/features, Inconvenience -15, Moderate Savings
           - "Threaten Cancellation / Request Retention": Inconvenience -5, Opportunity for discount
           - "Switch Competitor": Full cancellation & onboarding elsewhere, Inconvenience -40, High Savings
      2. Service Provider (MIN / Adversary):
         Actions:
           - "Reject Negotiation / Standard Pricing": Offers 0% discount
           - "Standard Retention Offer": 15% discount for 12 months
           - "Aggressive Retention Offer": 25% discount + free speed upgrade
           - "Bundle Upsell": 10% discount on combined services

    Payoff / Utility Function:
      Utility = Annual Savings (₹) - Friction / Inconvenience Penalty (₹ equivalent)
    """

    def __init__(self):
        pass

    def simulate(self, bill_name: str, provider: str, current_monthly_cost: float, search_depth: int = 3) -> Dict[str, Any]:
        annual_cost = current_monthly_cost * 12.0
        
        # Scenarios to evaluate at depth 1, 2, 3
        # Root node
        game_tree = {
            "state_id": "root",
            "agent": "User (MAX)",
            "action": "Evaluate Options",
            "utility_score": 0.0,
            "estimated_monthly_cost": current_monthly_cost,
            "children": []
        }

        # Branch 1: Retain Status Quo
        retain_utility = 0.0
        retain_node = {
            "state_id": "retain_status_quo",
            "agent": "User (MAX)",
            "action": "Retain Current Plan",
            "utility_score": round(retain_utility, 2),
            "estimated_monthly_cost": current_monthly_cost,
            "annual_savings": 0.0,
            "provider_response": "N/A (No action taken)",
            "friction_penalty": 0.0,
            "children": []
        }
        game_tree["children"].append(retain_node)

        # Branch 2: Downgrade Plan
        downgrade_savings_mo = current_monthly_cost * 0.30
        downgrade_friction = 1200.0  # ₹1200 inconvenience value for lower speed/tier
        downgrade_utility = (downgrade_savings_mo * 12) - downgrade_friction
        downgrade_node = {
            "state_id": "downgrade_tier",
            "agent": "User (MAX)",
            "action": "Downgrade to Standard Tier",
            "utility_score": round(downgrade_utility, 2),
            "estimated_monthly_cost": round(current_monthly_cost * 0.70, 2),
            "annual_savings": round(downgrade_savings_mo * 12, 2),
            "provider_response": "Provider permits downgrade without fee",
            "friction_penalty": downgrade_friction,
            "children": []
        }
        game_tree["children"].append(downgrade_node)

        # Branch 3: Switch Competitor
        switch_savings_mo = current_monthly_cost * 0.35
        switch_friction = 2500.0  # ₹2500 switching installation/cancellation hassle
        switch_utility = (switch_savings_mo * 12) - switch_friction
        switch_node = {
            "state_id": "switch_competitor",
            "agent": "User (MAX)",
            "action": "Port / Switch to Alternative ISP/Telecom",
            "utility_score": round(switch_utility, 2),
            "estimated_monthly_cost": round(current_monthly_cost * 0.65, 2),
            "annual_savings": round(switch_savings_mo * 12, 2),
            "provider_response": "Provider issues final settlement",
            "friction_penalty": switch_friction,
            "children": []
        }
        game_tree["children"].append(switch_node)

        # Branch 4: Negotiate Retention (Multi-round Minimax subtree)
        negotiate_node = {
            "state_id": "request_retention",
            "agent": "User (MAX)",
            "action": "Call Provider Retention Desk",
            "utility_score": 0.0,
            "estimated_monthly_cost": current_monthly_cost,
            "children": []
        }

        # Provider (MIN) counter-moves:
        # Move 4A: Provider Rejects (Disclose 0%)
        p_reject_utility = 0.0 - 500.0  # Lost 30 mins time (₹500 friction)
        p_reject_node = {
            "state_id": "provider_reject",
            "agent": "Provider (MIN)",
            "action": "Refuse Discount (Standard Policy)",
            "utility_score": round(p_reject_utility, 2),
            "estimated_monthly_cost": current_monthly_cost,
            "annual_savings": 0.0,
            "provider_offer": "Simulated: No concession granted.",
            "children": [
                {
                    "state_id": "user_after_reject_downgrade",
                    "agent": "User (MAX)",
                    "action": "Counter with Downgrade",
                    "utility_score": round(downgrade_utility - 500.0, 2),
                    "estimated_monthly_cost": round(current_monthly_cost * 0.70, 2),
                    "annual_savings": round(downgrade_savings_mo * 12, 2)
                }
            ]
        }

        # Move 4B: Provider Offers Moderate Retention (15% off)
        p_mod_savings = current_monthly_cost * 0.15 * 12
        p_mod_utility = p_mod_savings - 300.0  # Minimal phone call friction
        p_mod_node = {
            "state_id": "provider_offer_standard",
            "agent": "Provider (MIN)",
            "action": "Offer 15% Loyalty Discount",
            "utility_score": round(p_mod_utility, 2),
            "estimated_monthly_cost": round(current_monthly_cost * 0.85, 2),
            "annual_savings": round(p_mod_savings, 2),
            "provider_offer": "Simulated: 15% monthly bill reduction for 12 months.",
            "children": [
                {
                    "state_id": "user_accept_standard",
                    "agent": "User (MAX)",
                    "action": "Accept Loyalty Concession",
                    "utility_score": round(p_mod_utility, 2),
                    "estimated_monthly_cost": round(current_monthly_cost * 0.85, 2),
                    "annual_savings": round(p_mod_savings, 2)
                }
            ]
        }

        # Move 4C: Provider Offers Aggressive Retention (25% off)
        p_agg_savings = current_monthly_cost * 0.25 * 12
        p_agg_utility = p_agg_savings - 300.0
        p_agg_node = {
            "state_id": "provider_offer_aggressive",
            "agent": "Provider (MIN)",
            "action": "Offer 25% Competitive Retention",
            "utility_score": round(p_agg_utility, 2),
            "estimated_monthly_cost": round(current_monthly_cost * 0.75, 2),
            "annual_savings": round(p_agg_savings, 2),
            "provider_offer": "Simulated: 25% retention discount + free speed upgrade.",
            "children": [
                {
                    "state_id": "user_accept_aggressive",
                    "agent": "User (MAX)",
                    "action": "Accept Premium Retention",
                    "utility_score": round(p_agg_utility, 2),
                    "estimated_monthly_cost": round(current_monthly_cost * 0.75, 2),
                    "annual_savings": round(p_agg_savings, 2)
                }
            ]
        }

        negotiate_node["children"] = [p_reject_node, p_mod_node, p_agg_node]
        # In Minimax, provider MIN chooses expected mixed response; average/expected utility:
        expected_neg_utility = round((p_reject_node["utility_score"] * 0.20) + (p_mod_node["utility_score"] * 0.50) + (p_agg_node["utility_score"] * 0.30), 2)
        negotiate_node["utility_score"] = expected_neg_utility
        game_tree["children"].append(negotiate_node)

        # Minimax Decision Selection: MAX over {retain, downgrade, switch, negotiate}
        options = [
            {
                "strategy": "Retain Current Plan",
                "recommended_action": "Keep current subscription tier without alteration.",
                "utility_score": retain_node["utility_score"],
                "projected_monthly_cost": retain_node["estimated_monthly_cost"],
                "annual_savings": 0.0,
                "friction_rating": "Zero"
            },
            {
                "strategy": "Negotiate Retention Offer (Recommended)",
                "recommended_action": "Contact provider retention desk citing competitor pricing; fall back to downgrade if refused.",
                "utility_score": expected_neg_utility,
                "projected_monthly_cost": round(current_monthly_cost * 0.82, 2),
                "annual_savings": round(current_monthly_cost * 0.18 * 12, 2),
                "friction_rating": "Low (Single phone call)"
            },
            {
                "strategy": "Downgrade to Standard Tier",
                "recommended_action": "Step down to next lower plan tier to shed unutilized capacity.",
                "utility_score": downgrade_node["utility_score"],
                "projected_monthly_cost": downgrade_node["estimated_monthly_cost"],
                "annual_savings": downgrade_node["annual_savings"],
                "friction_rating": "Moderate (Reduced features/speed)"
            },
            {
                "strategy": "Switch to Competitor",
                "recommended_action": "Port connection to competitor offering new-customer introductory pricing.",
                "utility_score": switch_node["utility_score"],
                "projected_monthly_cost": switch_node["estimated_monthly_cost"],
                "annual_savings": switch_node["annual_savings"],
                "friction_rating": "High (Porting / Installation downtime)"
            }
        ]

        # Sort by minimax utility descending
        options.sort(key=lambda x: x["utility_score"], reverse=True)
        best_option = options[0]
        game_tree["utility_score"] = best_option["utility_score"]

        return {
            "bill_name": bill_name,
            "provider": provider,
            "current_monthly_cost": current_monthly_cost,
            "best_strategy": best_option["strategy"],
            "recommended_action": best_option["recommended_action"],
            "projected_monthly_cost": best_option["projected_monthly_cost"],
            "estimated_annual_savings": best_option["annual_savings"],
            "search_depth_evaluated": search_depth,
            "scenarios_evaluated": 7,
            "game_tree": game_tree,
            "strategy_comparison": options
        }

minimax_simulator = MinimaxBillSimulator()
