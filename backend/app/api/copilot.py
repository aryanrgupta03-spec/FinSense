from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from app.database import get_db
from app.models.user import User
from app.models.chat import Conversation, Message
from app.schemas.chat import ChatQueryRequest, CopilotQueryResponse, ConversationOut, MessageOut
from app.api.deps import get_current_user
from app.services.copilot_slm import copilot_service

router = APIRouter(prefix="/copilot", tags=["AI Financial Copilot"])

@router.post("/chat", response_model=CopilotQueryResponse)
def chat_with_copilot(
    req: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = copilot_service.process_chat(
        db=db,
        user=current_user,
        user_message=req.message,
        conversation_id=req.conversation_id
    )
    return result

@router.get("/conversations", response_model=List[Dict[str, Any]])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title,
            "created_at": c.created_at,
            "message_count": len(c.messages)
        }
        for c in convs
    ]

@router.get("/conversations/{conv_id}", response_model=ConversationOut)
def get_conversation_history(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conv_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv
