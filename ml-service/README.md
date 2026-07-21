# SkillSphere AI Job Matching Service

This is a local, lightweight machine learning service built with **FastAPI** and **sentence-transformers** to calculate hyperlocal matching scores between freelancers and gigs.

## Model Choice: `all-MiniLM-L6-v2`
We use the **`all-MiniLM-L6-v2`** model because:
1. **CPU-Friendly Execution**: It is highly optimized, small (80MB), and runs extremely fast on standard CPU environments without requiring expensive GPU compute.
2. **Dense Vector Embeddings**: It generates 384-dimensional embeddings that encode strong semantic relationships.
3. **Task Alignment**: It excels at semantic search and short-to-medium text comparisons (perfect for titles, descriptions, and lists of skills).

---

## Scoring Formula & Weights

Recommendations are ranked using a hybrid scoring formula:

$$\text{final\_score} = (0.60 \times \text{semantic\_similarity}) + (0.25 \times \text{normalized\_rating}) + (0.15 \times \text{proximity\_score})$$

### 1. Semantic Similarity (Weight: `0.60`)
- **Reasoning**: This is the primary capability alignment signal. If a freelancer's experience, skills, and bio do not match the gig description, they are not a viable candidate. It is computed as the Cosine Similarity between their profile text embeddings and the gig's text embedding, clamped to `[0, 1]`.

### 2. Reputation Score / Rating (Weight: `0.25`)
- **Reasoning**: Capped at `25%` of the total score. This ensures high-performing, verified freelancers get a boost, while preventing new, qualified freelancers (who lack ratings but have excellent skill matches) from being rendered invisible in search rankings. It is computed as $\text{reputation\_score} / 5.0$.

### 3. Proximity Score (Weight: `0.15`)
- **Reasoning**: SkillSphere supports hyperlocal matching, but distance is a discovery preference, not a hard barrier (since many gigs allow remote work). 
  - If a gig is `isRemoteOk == True`, the proximity score defaults to `1.0`.
  - Otherwise, it decays exponentially using $\exp(-\text{distance\_km} / 25.0)$, which scales down as the candidate's distance exceeds a 25km radius.

---

## System Classification Notice

> [!NOTE]
> This service acts as a **content-based filtering system enhanced by business heuristics**. It is **not** a collaborative trained recommender system. At this early stage of the marketplace, there is insufficient interaction data (clicks, hires, ratings) to train a neural recommender system responsibly.
