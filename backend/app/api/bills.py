from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import List, Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.finance import RecurringBill, Category
from app.models.intelligence import BillSimulation
from app.schemas.finance import RecurringBillCreate, RecurringBillUpdate, RecurringBillOut
from app.schemas.intelligence import MinimaxSimulationResponse
from app.api.deps import get_current_user
from app.services.minimax_simulator import minimax_simulator

router = APIRouter(prefix="/bills", tags=["Bills & Subscriptions"])

@router.get("", response_model=List[RecurringBillOut])
def list_recurring_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(RecurringBill)
        .filter(RecurringBill.user_id == current_user.id)
        .order_by(RecurringBill.next_due_date.asc())
        .all()
    )

@router.post("", response_model=RecurringBillOut)
def create_recurring_bill(
    b_in: RecurringBillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = RecurringBill(user_id=current_user.id, **b_in.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill

@router.put("/{bill_id}", response_model=RecurringBillOut)
def update_recurring_bill(
    bill_id: int,
    b_update: RecurringBillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(RecurringBill).filter(RecurringBill.id == bill_id, RecurringBill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Recurring bill not found")
    for k, v in b_update.model_dump(exclude_unset=True).items():
        setattr(bill, k, v)
    db.commit()
    db.refresh(bill)
    return bill

@router.delete("/{bill_id}")
def delete_recurring_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(RecurringBill).filter(RecurringBill.id == bill_id, RecurringBill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Recurring bill not found")
    db.delete(bill)
    db.commit()
    return {"message": "Recurring bill removed successfully"}

@router.post("/{bill_id}/simulate-minimax", response_model=MinimaxSimulationResponse)
def simulate_bill_strategy(
    bill_id: int,
    search_depth: int = 3,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = db.query(RecurringBill).filter(RecurringBill.id == bill_id, RecurringBill.user_id == current_user.id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Recurring bill not found")

    result = minimax_simulator.simulate(
        bill_name=bill.name,
        provider=bill.provider or "Service Provider",
        current_monthly_cost=bill.amount,
        search_depth=search_depth
    )

    # Persist simulation record
    sim_db = BillSimulation(
        user_id=current_user.id,
        bill_id=bill.id,
        bill_name=bill.name,
        current_cost=bill.amount,
        algorithm="Minimax Game-Tree",
        rounds_evaluated=search_depth,
        best_strategy=result["best_strategy"],
        estimated_annual_savings=result["estimated_annual_savings"],
        game_tree_json=result["game_tree"]
    )
    db.add(sim_db)
    db.commit()

    return result
