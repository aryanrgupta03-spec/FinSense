from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.user import User
from app.models.finance import Transaction
from app.api.deps import get_current_user
from app.services.neural_analytics import supervised_anomaly_model, competitive_clusterer

router = APIRouter(prefix="/insights", tags=["Spending Insights & Neural Analytics"])

@router.get("/anomalies", response_model=Dict[str, Any])
def get_anomalies_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    all_txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .all()
    )

    anomalous = [t for t in all_txs if t.is_anomaly]
    
    anomalous_records = [
        {
            "id": t.id,
            "date": t.date.strftime("%Y-%m-%d"),
            "description": t.description,
            "merchant": t.merchant or "N/A",
            "amount": t.amount,
            "category": t.category.name if t.category else "Uncategorized",
            "anomaly_score": t.anomaly_score,
            "anomaly_reason": t.anomaly_reason,
            "payment_method": t.payment_method
        }
        for t in anomalous
    ]

    return {
        "total_evaluated": len(all_txs),
        "anomalies_detected": len(anomalous),
        "anomaly_rate_pct": round((len(anomalous) / max(1, len(all_txs))) * 100, 1),
        "model_architecture": "Supervised Multilayer Perceptron (MLP) Classifier with Sigmoid Activation",
        "evaluation_metrics": supervised_anomaly_model.metrics,
        "features_used": supervised_anomaly_model.metrics["features"],
        "anomalous_transactions": anomalous_records
    }

@router.get("/clusters", response_model=Dict[str, Any])
def get_spending_clusters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster_profiles = competitive_clusterer.get_cluster_profiles()

    # Synthetic 2D projection scatter points for visualization:
    # PCA / t-SNE style 2D coordinates representing clusters
    scatter_points = [
        {"x": 68.0, "y": 72.0, "cluster_id": 0, "label": "Weekend Dining & Pubs (₹4,800)", "amount": 4800.0},
        {"x": 75.0, "y": 80.0, "cluster_id": 0, "label": "Electronics Boutiques (₹18,500)", "amount": 18500.0},
        {"x": 62.0, "y": 65.0, "cluster_id": 0, "label": "Fine Dining (₹3,600)", "amount": 3600.0},
        {"x": 20.0, "y": 85.0, "cluster_id": 1, "label": "Apartment Rent (₹32,000)", "amount": 32000.0},
        {"x": 25.0, "y": 78.0, "cluster_id": 1, "label": "Monthly Groceries D-Mart (₹4,850)", "amount": 4850.0},
        {"x": 22.0, "y": 68.0, "cluster_id": 1, "label": "Tata Power Bill (₹2,450)", "amount": 2450.0},
        {"x": 82.0, "y": 25.0, "cluster_id": 2, "label": "Flexi Cap SIP (₹20,000)", "amount": 20000.0},
        {"x": 78.0, "y": 18.0, "cluster_id": 2, "label": "Liquid Mutual Fund (₹15,000)", "amount": 15000.0},
        {"x": 45.0, "y": 48.0, "cluster_id": 3, "label": "Jio Fiber Broadband (₹1,199)", "amount": 1199.0},
        {"x": 52.0, "y": 42.0, "cluster_id": 3, "label": "Fuel & Commute (₹3,200)", "amount": 3200.0}
    ]

    return {
        "algorithm": "Unsupervised Competitive Learning Network (Vector Quantization / Self-Organizing Map)",
        "quantization_error": competitive_clusterer.quantization_error,
        "num_clusters": competitive_clusterer.num_clusters,
        "learning_rule": "Winner-Take-All (WTA) Weight Update: w_c <- w_c + alpha * (x - w_c)",
        "clusters": cluster_profiles,
        "visualization_points": scatter_points
    }
