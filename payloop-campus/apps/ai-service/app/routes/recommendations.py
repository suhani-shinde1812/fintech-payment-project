from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any, Dict, List
from app.services.ai_provider import get_ai_provider

router = APIRouter()

class RecommendRequest(BaseModel):
    studentData: Dict[str, Any]
    availableOffers: List[Dict[str, Any]]

@router.post("/recommendations")
async def get_recommendations(data: RecommendRequest):
    provider = get_ai_provider()
    recs = await provider.recommend_offers(data.studentData, data.availableOffers)
    return {"recommendations": recs, "provider": provider.provider_name}
