from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CandidateProfile(BaseModel):
    id: str
    skills: List[str]
    experience: str
    bio: Optional[str] = ""

class JobDescription(BaseModel):
    id: str
    required_skills: List[str]
    description: str

class MatchRequest(BaseModel):
    job: JobDescription
    candidates: List[CandidateProfile]

class CandidateScore(BaseModel):
    candidate_id: str
    score: float
    matched_skills: List[str]

class MatchResponse(BaseModel):
    job_id: str
    scores: List[CandidateScore]
    timestamp: str

class TextEmbeddingRequest(BaseModel):
    text: str

class TextEmbeddingResponse(BaseModel):
    embedding: List[float]
