from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

# 1. PEAS Agent Schemas
class PEASRecommendation(BaseModel):
    id: str
    priority: int  # 1 (highest) to 5
    title: str
    category: str
    action_type: str  # "budget_cut", "bill_renegotiation", "emergency_boost", "investment_opportunity"
    estimated_monthly_savings: float
    confidence_score: float
    rationale: str
    suggested_action_url: Optional[str] = None

class PEASAnalysisResponse(BaseModel):
    timestamp: datetime
    performance_metrics: Dict[str, Any]
    environment_state: Dict[str, Any]
    sensor_inputs: Dict[str, Any]
    actuator_proposals: List[PEASRecommendation]

# 2. Prolog Financial Reasoning Schemas
class PrologRuleResult(BaseModel):
    rule_name: str
    rule_type: str  # "budget_violation", "approaching_limit", "upcoming_bill", "goal_shortfall", "emergency_fund_risk"
    severity: str   # "critical", "warning", "info"
    fact_details: Dict[str, Any]
    inferred_explanation: str

class PrologAuditResponse(BaseModel):
    timestamp: datetime
    facts_asserted: int
    rules_evaluated: int
    findings: List[PrologRuleResult]
    summary: str

# 3. Financial Dependency Graph Schemas
class DependencyGraphNode(BaseModel):
    id: str
    label: str
    type: str  # "income_source", "mandatory_expense", "discretionary_expense", "debt_bill", "savings_goal"
    amount: float
    flexible: bool

class DependencyGraphEdge(BaseModel):
    source: str
    target: str
    allocation_amount: float
    percentage_of_source: float

class DependencyGraphResponse(BaseModel):
    nodes: List[DependencyGraphNode]
    edges: List[DependencyGraphEdge]
    total_inflows: float
    total_outflows: float
    net_surplus: float

class ImpactAnalysisRequest(BaseModel):
    altered_node_id: str
    amount_change_percentage: float  # e.g. -20 for 20% salary cut

class ImpactAnalysisResponse(BaseModel):
    traversal_algorithm: str  # "BFS" (affected breadth) or "DFS" (full cascade path)
    affected_nodes: List[Dict[str, Any]]
    surplus_impact: float
    cascade_summary: str

# 4. A* Goal-Based Budget Search Schemas
class AStarPlanRequest(BaseModel):
    goal_id: int
    override_target_amount: Optional[float] = None
    override_deadline_months: Optional[int] = None
    strict_mode: Optional[bool] = False

class AStarStep(BaseModel):
    category_id: int
    category_name: str
    current_spend: float
    proposed_spend: float
    reduction_amount: float
    reduction_percentage: float
    inconvenience_weight: float
    rationale: str

class AStarPlanResponse(BaseModel):
    goal_name: str
    target_amount: float
    current_saved: float
    months_remaining: int
    required_monthly_savings: float
    current_monthly_surplus: float
    is_feasible: bool
    total_monthly_savings_unlocked: float
    new_monthly_surplus: float
    inconvenience_path_cost: float
    heuristic_gap: float
    reduction_steps: List[AStarStep]
    feasibility_notes: str
    alternative_options: Optional[List[Dict[str, Any]]] = None

# 5. Minimax Bill Strategy Simulator Schemas
class MinimaxSimulationRequest(BaseModel):
    bill_id: int
    search_depth: Optional[int] = 3

class MinimaxNode(BaseModel):
    state_id: str
    agent: str  # "User" (MAX) or "Provider" (MIN)
    action: str
    utility_score: float
    estimated_monthly_cost: float
    provider_offer: Optional[str] = None
    children: Optional[List[Any]] = None

class MinimaxSimulationResponse(BaseModel):
    bill_name: str
    provider: str
    current_monthly_cost: float
    best_strategy: str
    recommended_action: str
    projected_monthly_cost: float
    estimated_annual_savings: float
    search_depth_evaluated: int
    scenarios_evaluated: int
    game_tree: Dict[str, Any]
    strategy_comparison: List[Dict[str, Any]]

# 6. Fuzzy Spending Alert Controller Schemas
class FuzzySpendingResponse(BaseModel):
    burn_rate: float            # e.g. 1.25 (125% of pro-rata budget)
    burn_rate_memberships: Dict[str, float]
    days_remaining: int
    days_memberships: Dict[str, float]
    goal_progress: float        # e.g. 68%
    goal_progress_memberships: Dict[str, float]
    active_rules: List[str]
    urgency_score: float        # 0 to 100
    status: str                 # "Comfortable", "Caution", "High Risk", "Spending Freeze Recommended"
    explanation: str

# 7. Investment Readiness Schemas (Mamdani vs Sugeno)
class InvestmentReadinessResponse(BaseModel):
    inputs: Dict[str, float]  # emergency_coverage, expense_stability, goal_progress, monthly_surplus
    
    # Mamdani FIS
    mamdani_readiness_score: float
    mamdani_status: str       # "Not Ready", "Emerging", "Moderate", "Highly Ready"
    mamdani_active_rules: List[str]
    
    # Sugeno FIS
    sugeno_investable_surplus: float  # Crisp INR amount
    sugeno_safety_ceiling: float
    sugeno_active_rules: List[str]
    
    comparison_analysis: str
    disclaimer: str

# 8. ANFIS Cash-Flow Forecast Schemas
class ANFISForecastResponse(BaseModel):
    target_period: str
    current_balance: float
    average_daily_spending: float
    upcoming_fixed_bills: float
    expected_salary_inflow: float
    anfis_predicted_closing_balance: float
    baseline_predicted_closing_balance: float
    confidence_interval_low: float
    confidence_interval_high: float
    mae: float
    rmse: float
    rules_count: int
    fuzzy_memberships: Dict[str, Any]
    timeline: List[Dict[str, Any]]
    is_demonstration_mode: bool

# 9. Neural Analytics (Supervised Anomaly + Unsupervised Competitive Learning)
class AnomalyDetectionResponse(BaseModel):
    total_evaluated: int
    anomalies_detected: int
    model_metrics: Dict[str, Any]  # accuracy, precision, recall, f1, confusion_matrix
    features_used: List[str]
    anomalous_transactions: List[Dict[str, Any]]

class SpendingClusterProfile(BaseModel):
    cluster_id: int
    cluster_name: str
    size_percentage: float
    avg_monthly_spend: float
    top_categories: List[str]
    behavior_description: str

class SpendingClustersResponse(BaseModel):
    total_samples: int
    num_clusters: int
    clusters: List[SpendingClusterProfile]
    quantization_error: float
    visualization_points: List[Dict[str, Any]]

# Notifications
class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    source_technique: str
    priority: int
    is_read: bool
    action_link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
