"""
PayLoop AI Service — FastAPI

Provides AI-powered spending insights, recommendations, and chat
for PayLoop Campus. Designed to be provider-agnostic — can connect
to OpenAI, Gemini, or any LLM by implementing the AIProvider interface.

⚠️  This service provides educational insights ONLY.
    It does NOT provide regulated financial, investment, or lending advice.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import sys
import uvicorn
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.routes import insights, chat, recommendations

load_dotenv()

app = FastAPI(
    title="PayLoop AI Service",
    description="Educational AI insights for PayLoop Campus students",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(insights.router, prefix="", tags=["Insights"])
app.include_router(chat.router, prefix="", tags=["Chat"])
app.include_router(recommendations.router, prefix="", tags=["Recommendations"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "PayLoop AI Service"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    is_dev = os.getenv("NODE_ENV") != "production" and os.getenv("ENV") != "production"
    if is_dev:
        uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
    else:
        uvicorn.run(app, host="0.0.0.0", port=port)
