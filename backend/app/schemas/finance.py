from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Category Schemas
class CategoryBase(BaseModel):
    name: str
    icon: Optional[str] = "tag"
    is_essential: Optional[bool] = False
    flexibility_score: Optional[float] = 0.5

class CategoryCreate(CategoryBase):
    pass

class CategoryOut(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# Account Schemas
class AccountBase(BaseModel):
    name: str
    account_type: Optional[str] = "checking"
    balance: Optional[float] = 0.0
    currency: Optional[str] = "INR"
    is_primary: Optional[bool] = False

class AccountCreate(AccountBase):
    pass

class AccountOut(AccountBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionBase(BaseModel):
    account_id: int
    category_id: Optional[int] = None
    date: date
    amount: float
    transaction_type: str  # "income" or "expense"
    description: str
    merchant: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None
    is_recurring: Optional[bool] = False

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    account_id: Optional[int] = None
    category_id: Optional[int] = None
    date: Optional[date] = None
    amount: Optional[float] = None
    transaction_type: Optional[str] = None
    description: Optional[str] = None
    merchant: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    is_recurring: Optional[bool] = None
    user_corrected_category: Optional[bool] = None

class TransactionOut(TransactionBase):
    id: int
    user_id: int
    is_anomaly: bool
    anomaly_score: float
    anomaly_reason: Optional[str] = None
    user_corrected_category: bool
    created_at: datetime
    category: Optional[CategoryOut] = None
    account: Optional[AccountOut] = None

    class Config:
        from_attributes = True

class CSVImportSummary(BaseModel):
    total_processed: int
    imported_count: int
    duplicate_count: int
    error_count: int
    anomalies_detected: int
    sample_records: List[TransactionOut]

# Budget Schemas
class BudgetBase(BaseModel):
    category_id: int
    period: str  # e.g. "2026-10"
    limit_amount: float

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    limit_amount: float

class BudgetOut(BudgetBase):
    id: int
    user_id: int
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True

class BudgetStatus(BaseModel):
    id: int
    category_id: int
    category_name: str
    limit_amount: float
    spent_amount: float
    remaining_amount: float
    percentage_consumed: float
    average_daily_spending: float
    projected_month_end_spending: float
    overrun_amount: float
    status: str  # "normal", "approaching", "exceeded"

# Goal Schemas
class GoalBase(BaseModel):
    name: str
    target_amount: float
    current_amount: Optional[float] = 0.0
    deadline: date
    priority: Optional[str] = "medium"
    category_id: Optional[int] = None
    notes: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[date] = None
    priority: Optional[str] = None
    category_id: Optional[int] = None
    notes: Optional[str] = None

class GoalOut(GoalBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class GoalProjection(BaseModel):
    goal: GoalOut
    days_remaining: int
    months_remaining: float
    required_monthly_savings: float
    current_monthly_surplus: float
    shortfall: float
    feasibility_status: str  # "On Track", "Needs Adjustment", "At Risk"
    completion_percentage: float

# Recurring Bill Schemas
class RecurringBillBase(BaseModel):
    name: str
    category_id: Optional[int] = None
    amount: float
    billing_cycle: Optional[str] = "monthly"
    due_day: Optional[int] = 1
    next_due_date: date
    provider: Optional[str] = None
    status: Optional[str] = "active"
    negotiable: Optional[bool] = True

class RecurringBillCreate(RecurringBillBase):
    pass

class RecurringBillUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    amount: Optional[float] = None
    billing_cycle: Optional[str] = None
    due_day: Optional[int] = None
    next_due_date: Optional[date] = None
    provider: Optional[str] = None
    status: Optional[str] = None
    negotiable: Optional[bool] = None

class RecurringBillOut(RecurringBillBase):
    id: int
    user_id: int
    created_at: datetime
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True
