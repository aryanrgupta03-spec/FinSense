from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    icon = Column(String(50), default="tag")
    is_essential = Column(Boolean, default=False)  # Rent, groceries, medical are essential
    flexibility_score = Column(Float, default=0.5)  # 0.0 = impossible to cut, 1.0 = highly flexible discretionary

    # Relationships
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")
    recurring_bills = relationship("RecurringBill", back_populates="category")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)  # e.g. "HDFC Salary Account", "SBI Savings", "ICICI Amazon Pay Card"
    account_type = Column(String(50), default="checking")  # checking, savings, credit, investment, cash
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    transaction_type = Column(String(20), nullable=False)  # "income" or "expense"
    description = Column(String(255), nullable=False)
    merchant = Column(String(150), nullable=True)
    payment_method = Column(String(50), default="UPI")  # UPI, NetBanking, Debit Card, Credit Card, Cash
    notes = Column(Text, nullable=True)
    
    is_recurring = Column(Boolean, default=False)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    anomaly_reason = Column(String(255), nullable=True)
    user_corrected_category = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, index=True)
    period = Column(String(20), nullable=False, index=True)  # "2026-10" or "monthly"
    limit_amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")

class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(150), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(Date, nullable=False)
    priority = Column(String(20), default="medium")  # high, medium, low
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="goals")

class RecurringBill(Base):
    __tablename__ = "recurring_bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(150), nullable=False)
    amount = Column(Float, nullable=False)
    billing_cycle = Column(String(20), default="monthly")  # monthly, yearly, quarterly
    due_day = Column(Integer, default=1)  # 1st - 31st of month
    next_due_date = Column(Date, nullable=False)
    provider = Column(String(150), nullable=True)  # e.g. "Jio Fiber", "Airtel", "Netflix India", "Tata Power"
    status = Column(String(30), default="active")  # active, paused, cancelled, under_review
    negotiable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="recurring_bills")
    category = relationship("Category", back_populates="recurring_bills")
