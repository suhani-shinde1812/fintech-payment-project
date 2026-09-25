from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict
from app.services.ai_provider import get_ai_provider

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    studentData: Dict[str, Any]

@router.post("/chat")
async def chat(data: ChatRequest):
    provider = get_ai_provider()
    reply = await provider.chat(data.message, {"studentData": data.studentData})
    return {"reply": reply, "provider": provider.provider_name}
