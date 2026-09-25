from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from app.services.ai_provider import get_ai_provider

router = APIRouter()

class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    count: int

class InsightRequest(BaseModel):
    studentName: str
    currentMonthTotal: float
    lastMonthTotal: float
    transactionCount: int
    categoryBreakdown: List[CategoryBreakdown]
    totalPoints: int
    demoBalance: float

@router.post("/insights")
async def get_insights(data: InsightRequest):
    provider = get_ai_provider()
    insight = await provider.generate_insight(data.model_dump())
    return insight
