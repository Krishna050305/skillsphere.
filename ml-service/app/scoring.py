import numpy as np
from typing import List
from app.schemas import CandidateProfile, JobDescription, CandidateScore
from app.model import model_wrapper

def cosine_similarity(v1, v2):
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    return float(dot_product / (norm_v1 * norm_v2))

def calculate_match_scores(job: JobDescription, candidates: List[CandidateProfile]) -> List[CandidateScore]:
    if not candidates:
        return []

    # Get texts to embed
    job_text = f"{job.description} {' '.join(job.required_skills)}"
    candidate_texts = []
    for c in candidates:
        candidate_texts.append(f"{c.bio} {c.experience} {' '.join(c.skills)}")

    # Get embeddings (using singleton wrapper)
    all_texts = [job_text] + candidate_texts
    embeddings = model_wrapper.get_embeddings(all_texts)
    
    job_emb = embeddings[0]
    candidate_embs = embeddings[1:]

    scores = []
    for idx, candidate in enumerate(candidates):
        # Calculate semantic cosine similarity
        sem_score = cosine_similarity(job_emb, candidate_embs[idx])
        
        # Calculate skill overlap score
        job_skills = set(s.lower() for s in job.required_skills)
        cand_skills = set(s.lower() for s in candidate.skills)
        
        if job_skills:
            overlap = job_skills.intersection(cand_skills)
            skill_score = len(overlap) / len(job_skills)
        else:
            skill_score = 1.0

        # Combine scores (70% semantic similarity, 30% skill overlap)
        # Normalize sem_score from [-1, 1] to [0, 1]
        normalized_sem = max(0.0, (sem_score + 1.0) / 2.0)
        final_score = (normalized_sem * 0.7) + (skill_score * 0.3)

        # Build list of matched skills
        matched = list(job_skills.intersection(cand_skills))

        scores.append(CandidateScore(
            candidate_id=candidate.id,
            score=round(final_score, 4),
            matched_skills=matched
        ))

    # Sort candidates by score in descending order
    scores.sort(key=lambda x: x.score, reverse=True)
    return scores
