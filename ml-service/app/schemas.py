from pydantic import BaseModel
from typing import List, Optional

class EmbedRequest(BaseModel):
    text: str

class EmbedResponse(BaseModel):
    embedding: List[float]

class MatchCandidate(BaseModel):
    id: str
    embedding: List[float]
    reputation_score: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class MatchRequest(BaseModel):
    target_embedding: List[float]
    target_lat: Optional[float] = None
    target_lon: Optional[float] = None
    is_remote_ok: bool
    candidates: List[MatchCandidate]

class MatchResult(BaseModel):
    id: str
    score: float

class MatchResponse(BaseModel):
    results: List[MatchResult]
