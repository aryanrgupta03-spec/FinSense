from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class ForecastRecord(Base):
    __tablename__ = "forecast_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    forecast_date = Column(DateTime, default=datetime.utcnow, index=True)
    target_period = Column(String(20), nullable=False)  # "2026-10"
    model_name = Column(String(50), default="ANFIS")  # "ANFIS" or "Baseline"
    predicted_closing_balance = Column(Float, nullable=False)
    baseline_predicted = Column(Float, nullable=False)
    actual_closing_balance = Column(Float, nullable=True)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    confidence_interval_low = Column(Float, nullable=True)
    confidence_interval_high = Column(Float, nullable=True)
    inputs_json = Column(JSON, nullable=True)  # {current_balance, daily_burn, fixed_bills, expected_income}

class AssessmentRecord(Base):
    __tablename__ = "assessment_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_date = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Fuzzy Spending Alert Controller (Burn rate, days remaining, savings progress)
    fuzzy_urgency_score = Column(Float, nullable=False)  # 0 to 100
    fuzzy_status = Column(String(50), nullable=False)   # Comfortable, Caution, High Risk, Spending Freeze Recommended
    
    # Investment Readiness (Mamdani vs Sugeno)
    mamdani_readiness_score = Column(Float, nullable=False)  # 0 to 100
    mamdani_status = Column(String(50), nullable=False)     # Not Ready, Emerging, Moderate, Highly Ready
    sugeno_investable_surplus = Column(Float, nullable=False)  # Numeric crisp INR amount
    
    inputs_json = Column(JSON, nullable=True)
    explanations_json = Column(JSON, nullable=True)

class OptimizationScenario(Base):
    __tablename__ = "optimization_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    target_amount = Column(Float, nullable=False)
    deadline = Column(String(30), nullable=False)
    search_algorithm = Column(String(50), default="A*")
    is_feasible = Column(Boolean, default=True)
    total_monthly_savings_achieved = Column(Float, default=0.0)
    heuristic_cost = Column(Float, default=0.0)
    steps_json = Column(JSON, nullable=False)  # [{category, current_spend, proposed_spend, reduction, inconvenience_weight}]
    rationale = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class BillSimulation(Base):
    __tablename__ = "bill_simulations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bill_id = Column(Integer, ForeignKey("recurring_bills.id", ondelete="CASCADE"), nullable=False)
    bill_name = Column(String(150), nullable=False)
    current_cost = Column(Float, nullable=False)
    algorithm = Column(String(50), default="Minimax")
    rounds_evaluated = Column(Integer, default=3)
    best_strategy = Column(String(100), nullable=False)  # e.g. "Negotiate with Downgrade Fallback"
    estimated_annual_savings = Column(Float, default=0.0)
    game_tree_json = Column(JSON, nullable=False)  # Game tree with user choices & simulated provider counter-actions
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info")  # alert, recommendation, warning, info
    source_technique = Column(String(100), default="PEAS")  # PEAS, Prolog, Fuzzy, Anomaly, Minimax, A*
    priority = Column(Integer, default=1)  # 1 (low) to 5 (critical)
    is_read = Column(Boolean, default=False)
    action_link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class ModelRun(Base):
    __tablename__ = "model_runs"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)  # Anomaly_Perceptron, Competitive_Learning_SOM, ANFIS
    run_type = Column(String(50), default="training")   # training, evaluation
    metrics_json = Column(JSON, nullable=False)         # {precision, recall, f1, confusion_matrix} or {mae, rmse}
    parameters_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
