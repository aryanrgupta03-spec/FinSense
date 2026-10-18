"""
FinSense Demonstration Dataset Generator
Populates a coherent, realistic Indian personal-finance profile in INR (₹)
Includes chronological transactions, budgets, goals, recurring obligations, and calibrated anomalies.
"""

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.finance import Account, Category, Transaction, Budget, Goal, RecurringBill
from app.models.intelligence import Notification, ModelRun
from app.services.auth_service import hash_password
from app.services.neural_analytics import supervised_anomaly_model

def seed_database(db: Session) -> User:
    """
    Seeds database with demonstration profile if not present, or resets it cleanly.
    """
    # Check if demo user already exists
    demo_user = db.query(User).filter(User.email == "demo@finsense.ai").first()
    if demo_user:
        return demo_user

    # 1. Create Demo User
    demo_user = User(
        email="demo@finsense.ai",
        hashed_password=hash_password("finsense123"),
        full_name="Aryan R. Gupta",
        monthly_income=125000.0,
        currency="INR"
    )
    db.add(demo_user)
    db.commit()
    db.refresh(demo_user)

    # 2. Categories
    categories_data = [
        {"name": "Housing & Rent", "icon": "home", "is_essential": True, "flexibility_score": 0.0},
        {"name": "Groceries & Household", "icon": "shopping-cart", "is_essential": True, "flexibility_score": 0.2},
        {"name": "Utilities & Bills", "icon": "zap", "is_essential": True, "flexibility_score": 0.1},
        {"name": "Healthcare & Medical", "icon": "activity", "is_essential": True, "flexibility_score": 0.0},
        {"name": "Dining Out & Food Delivery", "icon": "coffee", "is_essential": False, "flexibility_score": 0.9},
        {"name": "Shopping & Lifestyle", "icon": "shopping-bag", "is_essential": False, "flexibility_score": 0.8},
        {"name": "Entertainment & Subscriptions", "icon": "film", "is_essential": False, "flexibility_score": 0.75},
        {"name": "Travel & Commute", "icon": "navigation", "is_essential": False, "flexibility_score": 0.5},
        {"name": "Investments & SIP", "icon": "trending-up", "is_essential": False, "flexibility_score": 0.3},
        {"name": "Salary & Income", "icon": "dollar-sign", "is_essential": True, "flexibility_score": 0.0}
    ]

    cat_map = {}
    for cdata in categories_data:
        cat = db.query(Category).filter(Category.name == cdata["name"]).first()
        if not cat:
            cat = Category(**cdata)
            db.add(cat)
            db.commit()
            db.refresh(cat)
        cat_map[cdata["name"]] = cat

    # 3. Accounts
    accounts_data = [
        {"name": "HDFC Premium Salary Account", "account_type": "checking", "balance": 72500.0, "is_primary": True},
        {"name": "SBI Emergency Reserve", "account_type": "savings", "balance": 150000.0, "is_primary": False},
        {"name": "ICICI Amazon Pay Credit Card", "account_type": "credit", "balance": -14200.0, "is_primary": False},
        {"name": "Zerodha Coin Liquid Reserves", "account_type": "investment", "balance": 85000.0, "is_primary": False}
    ]

    acct_map = {}
    for adata in accounts_data:
        acct = Account(user_id=demo_user.id, **adata)
        db.add(acct)
        db.commit()
        db.refresh(acct)
        acct_map[adata["name"]] = acct

    primary_acct = acct_map["HDFC Premium Salary Account"]
    savings_acct = acct_map["SBI Emergency Reserve"]
    credit_acct = acct_map["ICICI Amazon Pay Credit Card"]

    # 4. Recurring Bills
    today = date.today()
    bills_data = [
        {"name": "JioFiber 300Mbps Broadband", "category_id": cat_map["Utilities & Bills"].id, "amount": 1199.0, "billing_cycle": "monthly", "due_day": 5, "next_due_date": today + timedelta(days=3), "provider": "Reliance Jio", "negotiable": True},
        {"name": "Tata Power Residential Electric", "category_id": cat_map["Utilities & Bills"].id, "amount": 2400.0, "billing_cycle": "monthly", "due_day": 12, "next_due_date": today + timedelta(days=7), "provider": "Tata Power", "negotiable": False},
        {"name": "Netflix Premium 4K", "category_id": cat_map["Entertainment & Subscriptions"].id, "amount": 649.0, "billing_cycle": "monthly", "due_day": 15, "next_due_date": today + timedelta(days=11), "provider": "Netflix India", "negotiable": True},
        {"name": "Airtel Postpaid Family Plan", "category_id": cat_map["Utilities & Bills"].id, "amount": 1099.0, "billing_cycle": "monthly", "due_day": 8, "next_due_date": today + timedelta(days=4), "provider": "Bharti Airtel", "negotiable": True},
        {"name": "Spotify Family Premium", "category_id": cat_map["Entertainment & Subscriptions"].id, "amount": 179.0, "billing_cycle": "monthly", "due_day": 20, "next_due_date": today + timedelta(days=16), "provider": "Spotify India", "negotiable": True}
    ]

    for bdata in bills_data:
        bill = RecurringBill(user_id=demo_user.id, **bdata)
        db.add(bill)
    db.commit()

    # 5. Budgets for Current Month
    current_period = today.strftime("%Y-%m")
    budgets_data = [
        {"category_id": cat_map["Dining Out & Food Delivery"].id, "limit_amount": 12000.0},
        {"category_id": cat_map["Groceries & Household"].id, "limit_amount": 20000.0},
        {"category_id": cat_map["Shopping & Lifestyle"].id, "limit_amount": 10000.0},
        {"category_id": cat_map["Entertainment & Subscriptions"].id, "limit_amount": 4000.0},
        {"category_id": cat_map["Travel & Commute"].id, "limit_amount": 8000.0},
        {"category_id": cat_map["Utilities & Bills"].id, "limit_amount": 7500.0}
    ]

    for bdata in budgets_data:
        b = Budget(user_id=demo_user.id, period=current_period, **bdata)
        db.add(b)
    db.commit()

    # 6. Goals
    goals_data = [
        {"name": "6-Month Emergency Fund", "target_amount": 300000.0, "current_amount": 150000.0, "deadline": today + timedelta(days=365), "priority": "high", "notes": "Statutory 6-month living expense reserve in high-yield liquid instruments"},
        {"name": "MacBook Pro M3 Max", "target_amount": 180000.0, "current_amount": 45000.0, "deadline": today + timedelta(days=210), "priority": "medium", "notes": "Hardware upgrade for developer productivity"},
        {"name": "Europe Expedition 2027", "target_amount": 250000.0, "current_amount": 60000.0, "deadline": today + timedelta(days=480), "priority": "low", "notes": "Vacation budget for 14-day European itinerary"}
    ]

    for gdata in goals_data:
        g = Goal(user_id=demo_user.id, **gdata)
        db.add(g)
    db.commit()

    # 7. Chronological Transactions (Past 60 days + Current month)
    # Generate realistic Indian merchant transactions
    tx_records = [
        # Incomes
        {"date": today.replace(day=1), "amount": 125000.0, "type": "income", "desc": "Monthly Salary Credit - TechCorp India", "merchant": "TechCorp", "method": "NetBanking", "cat": "Salary & Income", "acct": primary_acct},
        {"date": (today.replace(day=1) - timedelta(days=30)).replace(day=1), "amount": 125000.0, "type": "income", "desc": "Monthly Salary Credit - TechCorp India", "merchant": "TechCorp", "method": "NetBanking", "cat": "Salary & Income", "acct": primary_acct},
        
        # Mandatory: Rent
        {"date": today.replace(day=2), "amount": 32000.0, "type": "expense", "desc": "Apartment Rent Payment", "merchant": "Hiranandani Estate", "method": "NetBanking", "cat": "Housing & Rent", "acct": primary_acct},
        {"date": (today.replace(day=1) - timedelta(days=30)).replace(day=2), "amount": 32000.0, "type": "expense", "desc": "Apartment Rent Payment", "merchant": "Hiranandani Estate", "method": "NetBanking", "cat": "Housing & Rent", "acct": primary_acct},

        # Groceries
        {"date": today.replace(day=3), "amount": 4850.0, "type": "expense", "desc": "Monthly Essentials - D-Mart", "merchant": "D-Mart", "method": "UPI", "cat": "Groceries & Household", "acct": primary_acct},
        {"date": today.replace(day=8), "amount": 1420.0, "type": "expense", "desc": "Organic Vegetables & Dairy", "merchant": "Nature's Basket", "method": "UPI", "cat": "Groceries & Household", "acct": primary_acct},
        {"date": today.replace(day=14), "amount": 2150.0, "type": "expense", "desc": "Quick Groceries Order", "merchant": "Blinkit", "method": "UPI", "cat": "Groceries & Household", "acct": primary_acct},

        # Dining Out & Food Delivery (BREACHES BUDGET: total > 12000!)
        {"date": today.replace(day=4), "amount": 2400.0, "type": "expense", "desc": "Dinner with Friends", "merchant": "Social Mumbai", "method": "Credit Card", "cat": "Dining Out & Food Delivery", "acct": credit_acct},
        {"date": today.replace(day=6), "amount": 850.0, "type": "expense", "desc": "Dinner Delivery", "merchant": "Swiggy", "method": "UPI", "cat": "Dining Out & Food Delivery", "acct": primary_acct},
        {"date": today.replace(day=9), "amount": 3600.0, "type": "expense", "desc": "Team Celebration Dinner", "merchant": "Toit Brewery", "method": "Credit Card", "cat": "Dining Out & Food Delivery", "acct": credit_acct},
        {"date": today.replace(day=11), "amount": 1250.0, "type": "expense", "desc": "Gourmet Pizza Order", "merchant": "Zomato", "method": "UPI", "cat": "Dining Out & Food Delivery", "acct": primary_acct},
        {"date": today.replace(day=15), "amount": 4900.0, "type": "expense", "desc": "Weekend Fine Dining", "merchant": "Bastian", "method": "Credit Card", "cat": "Dining Out & Food Delivery", "acct": credit_acct},
        {"date": today.replace(day=16), "amount": 3800.0, "type": "expense", "desc": "Brunch & Beverages", "merchant": "Subko Coffee Roasters", "method": "Credit Card", "cat": "Dining Out & Food Delivery", "acct": credit_acct},

        # Utilities
        {"date": today.replace(day=5), "amount": 1199.0, "type": "expense", "desc": "Fiber Broadband Bill", "merchant": "Reliance Jio", "method": "UPI", "cat": "Utilities & Bills", "acct": primary_acct},
        {"date": today.replace(day=10), "amount": 2450.0, "type": "expense", "desc": "Electricity Bill Payment", "merchant": "Tata Power", "method": "NetBanking", "cat": "Utilities & Bills", "acct": primary_acct},

        # Travel & Commute
        {"date": today.replace(day=4), "amount": 850.0, "type": "expense", "desc": "Airport Cab", "merchant": "Uber India", "method": "UPI", "cat": "Travel & Commute", "acct": primary_acct},
        {"date": today.replace(day=7), "amount": 3200.0, "type": "expense", "desc": "Vehicle Fuel Tank Top-up", "merchant": "Indian Oil Petrol Pump", "method": "Credit Card", "cat": "Travel & Commute", "acct": credit_acct},
        {"date": today.replace(day=12), "amount": 420.0, "type": "expense", "desc": "Metro Card Recharge", "merchant": "Mumbai Metro", "method": "UPI", "cat": "Travel & Commute", "acct": primary_acct},

        # Investments
        {"date": today.replace(day=5), "amount": 20000.0, "type": "expense", "desc": "Parag Parikh Flexi Cap SIP", "merchant": "Zerodha Coin", "method": "NetBanking", "cat": "Investments & SIP", "acct": primary_acct},

        # --- Clearly Labelled Anomalous Transactions ---
        {
            "date": today.replace(day=13),
            "amount": 48500.0,
            "type": "expense",
            "desc": "Luxury Watch Purchase (Midnight Online)",
            "merchant": "Ethos Watch Boutiques",
            "method": "Credit Card",
            "cat": "Shopping & Lifestyle",
            "acct": credit_acct,
            "is_anomaly": True,
            "anomaly_score": 93.5,
            "anomaly_reason": "High-value discretionary purchase (₹48,500) occurring at 2:35 AM with 4.8x deviation from median transaction volume"
        },
        {
            "date": today.replace(day=7),
            "amount": 34999.0,
            "type": "expense",
            "desc": "High-End Noise Cancelling Headphones",
            "merchant": "Sony Center",
            "method": "Credit Card",
            "cat": "Shopping & Lifestyle",
            "acct": credit_acct,
            "is_anomaly": True,
            "anomaly_score": 82.0,
            "anomaly_reason": "Statistical amount anomaly: 3.5x higher than normal lifestyle category baseline"
        }
    ]

    for tx_data in tx_records:
        cat = cat_map.get(tx_data["cat"])
        acct = tx_data["acct"]
        
        is_anom = tx_data.get("is_anomaly", False)
        anom_score = tx_data.get("anomaly_score", 0.0)
        anom_reason = tx_data.get("anomaly_reason", None)

        if not is_anom and tx_data["type"] == "expense":
            # Run supervised neural model to get natural baseline score
            is_anom, anom_score, anom_reason = supervised_anomaly_model.score_transaction(
                amount=tx_data["amount"],
                category_name=cat.name if cat else "General",
                category_avg=1500.0,
                user_median_spend=1200.0,
                day_of_month=tx_data["date"].day
            )

        tx = Transaction(
            user_id=demo_user.id,
            account_id=acct.id,
            category_id=cat.id if cat else None,
            date=tx_data["date"],
            amount=tx_data["amount"],
            transaction_type=tx_data["type"],
            description=tx_data["desc"],
            merchant=tx_data.get("merchant"),
            payment_method=tx_data.get("method", "UPI"),
            is_anomaly=is_anom,
            anomaly_score=anom_score,
            anomaly_reason=anom_reason
        )
        db.add(tx)

    # 8. Initial Notifications from AI Modules
    notifs = [
        Notification(user_id=demo_user.id, title="Budget Overrun: Dining Out", message="Dining Out spending has reached ₹16,800 against allocated limit of ₹12,000 (Overrun: ₹4,800).", notification_type="alert", source_technique="Prolog", priority=1, action_link="/budgets"),
        Notification(user_id=demo_user.id, title="Statistical Anomaly Detected", message="Ethos Watch Boutiques transaction of ₹48,500 flagged by neural perceptron classifier.", notification_type="warning", source_technique="Anomaly Neural Net", priority=2, action_link="/insights"),
        Notification(user_id=demo_user.id, title="Impending Bill: JioFiber", message="JioFiber 300Mbps bill of ₹1,199 is due in 3 days. Account liquidity confirmed.", notification_type="info", source_technique="Prolog", priority=3, action_link="/bills"),
        Notification(user_id=demo_user.id, title="Minimax Renegotiation Opportunity", message="Minimax game tree simulator identified ₹2,800/yr savings potential on broadband retention.", notification_type="recommendation", source_technique="Minimax", priority=4, action_link="/bills")
    ]
    for n in notifs:
        db.add(n)

    # 9. Initial Model Training Runs
    m_runs = [
        ModelRun(model_name="Anomaly_Perceptron", run_type="training", metrics_json=supervised_anomaly_model.metrics, notes="Baseline trained on Indian retail transaction corpus"),
        ModelRun(model_name="ANFIS", run_type="training", metrics_json={"mae": 1240.50, "rmse": 1680.20, "rules": 4}, notes="5-Layer Takagi-Sugeno-Kang neuro-fuzzy cashflow forecaster"),
        ModelRun(model_name="Competitive_Learning_SOM", run_type="training", metrics_json={"quantization_error": 0.042, "num_clusters": 4}, notes="Winner-Take-All competitive clustering")
    ]
    for mr in m_runs:
        db.add(mr)

    db.commit()
    return demo_user

def reset_demo_database(db: Session) -> User:
    """
    Cleans all existing user data and re-seeds fresh demonstration profile.
    """
    user = db.query(User).filter(User.email == "demo@finsense.ai").first()
    if user:
        # Cascade deletes will clean child tables
        db.delete(user)
        db.commit()
    return seed_database(db)
