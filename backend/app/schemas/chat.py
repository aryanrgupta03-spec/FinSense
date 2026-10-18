from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChatQueryRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None

class MessageOut(BaseModel):
    id: int
    conversation_id: int
    sender: str
    content: str
    tools_used_json: Optional[List[str]] = None
    citations_json: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageOut]] = None

    class Config:
        from_attributes = True

class CopilotQueryResponse(BaseModel):
    conversation_id: int
    response: str
    tools_executed: List[str]
    citations: List[Dict[str, Any]]
    model_used: str
