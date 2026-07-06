from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import os
from dotenv import load_dotenv

from app.schemas import MatchRequest, MatchResponse, TextEmbeddingRequest, TextEmbeddingResponse
from app.scoring import calculate_match_scores
from app.model import model_wrapper

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SkillSphere ML Service",
    description="FastAPI service for AI-powered hyperlocal job matching",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to preload the model
@app.on_event("startup")
async def startup_event():
    model_wrapper.load_model()

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "FastAPI ML Service",
        "model": model_wrapper.model_name,
        "is_mock": isinstance(model_wrapper.model, type(model_wrapper.model)) and hasattr(model_wrapper.model, "encode") and "Mock" in type(model_wrapper.model).__name__,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/match", response_model=MatchResponse)
def match_candidates(request: MatchRequest):
    try:
        scores = calculate_match_scores(request.job, request.candidates)
        return MatchResponse(
            job_id=request.job.id,
            scores=scores,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Matching calculation failed: {str(e)}")

@app.post("/api/embed", response_model=TextEmbeddingResponse)
def get_embedding(request: TextEmbeddingRequest):
    try:
        embedding = model_wrapper.get_embeddings([request.text])[0]
        return TextEmbeddingResponse(embedding=embedding.tolist())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
