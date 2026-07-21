from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

from app.schemas import EmbedRequest, EmbedResponse, MatchRequest, MatchResponse, MatchResult
from app.scoring import cosine_similarity, haversine_distance_km, calculate_match_score
from app.model import embed_text, model

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SkillSphere ML Service",
    description="FastAPI service for AI-powered hyperlocal job matching",
    version="1.0.0"
)

# Configure CORS dynamically from environment variable
allowed_origin = os.getenv("ML_SERVICE_ALLOWED_ORIGIN", "*")
origins = [allowed_origin] if allowed_origin != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True if allowed_origin != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """
    Standard health check to confirm server status and model loading.
    """
    model_loaded = model is not None
    return {
        "status": "ok",
        "model_loaded": model_loaded
    }

@app.post("/embed", response_model=EmbedResponse)
def get_embedding(request: EmbedRequest):
    """
    Generates a 384-dimensional text embedding for matching.
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text parameter cannot be empty.")
        
        vector = embed_text(request.text)
        return EmbedResponse(embedding=vector)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding generation failed: {str(e)}")

@app.post("/match", response_model=MatchResponse)
def match_candidates(request: MatchRequest):
    """
    Computes weighted match scores between a target embedding (job/freelancer) and multiple candidates.
    """
    try:
        results = []
        for candidate in request.candidates:
            # 1. Compute cosine similarity
            sim = cosine_similarity(request.target_embedding, candidate.embedding)

            # 2. Compute geographic distance if locations are defined
            distance = None
            if (
                request.target_lat is not None and
                request.target_lon is not None and
                candidate.latitude is not None and
                candidate.longitude is not None
            ):
                distance = haversine_distance_km(
                    request.target_lat,
                    request.target_lon,
                    candidate.latitude,
                    candidate.longitude
                )

            # 3. Compute final weighted score
            score = calculate_match_score(
                semantic_similarity=sim,
                reputation_score=candidate.reputation_score,
                distance_km=distance,
                is_remote_ok=request.is_remote_ok
            )

            results.append(MatchResult(id=candidate.id, score=round(score, 4)))

        # Sort candidate results in descending order of matching score
        results.sort(key=lambda x: x.score, reverse=True)

        return MatchResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Match ranking computation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
