import math
import numpy as np

# Scoring weight constants
SEMANTIC_WEIGHT = 0.60
RATING_WEIGHT = 0.25
PROXIMITY_WEIGHT = 0.15

def cosine_similarity(vec_a, vec_b) -> float:
    """
    Computes cosine similarity between two vectors using numpy.
    """
    a = np.array(vec_a)
    b = np.array(vec_b)
    dot = np.dot(a, b)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(dot / (norm_a * norm_b))

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes distance in kilometers between two geo-coordinate points.
    """
    # Earth radius in kilometers
    R = 6371.0

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

def calculate_match_score(
    semantic_similarity: float,
    reputation_score: float,
    distance_km: float | None,
    is_remote_ok: bool
) -> float:
    """
    Computes final recommendation score combining semantic, rating, and proximity signals.
    """
    # 1. Clamp semantic similarity to [0, 1]
    clamped_semantic = max(0.0, min(1.0, semantic_similarity))

    # 2. Normalize reputation score (0-5 scale)
    normalized_rating = max(0.0, min(1.0, reputation_score / 5.0))

    # 3. Calculate proximity score
    if is_remote_ok:
        proximity_score = 1.0
    elif distance_km is not None:
        # Distance decay formula: exp(-d / 25)
        proximity_score = math.exp(-distance_km / 25.0)
    else:
        # If not remote-ok and distance is unavailable, score is 0
        proximity_score = 0.0

    final_score = (SEMANTIC_WEIGHT * clamped_semantic) + \
                  (RATING_WEIGHT * normalized_rating) + \
                  (PROXIMITY_WEIGHT * proximity_score)

    return float(final_score)
