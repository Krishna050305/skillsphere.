import os
import numpy as np

# Load the sentence-transformers model "all-MiniLM-L6-v2" ONCE at module import time
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

MODEL_NAME = "all-MiniLM-L6-v2"

# Set caching directory to workspace to avoid re-downloading to temp paths
os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "..", ".hf_cache")

class MockEmbeddingModel:
    def __init__(self):
        print("Using MockEmbeddingModel as fallback.")

    def encode(self, text: str) -> np.ndarray:
        # Generate stable mock embeddings based on text characters
        np.random.seed(sum(ord(c) for c in text) % 2**32)
        vec = np.random.randn(384)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

# Load model at import time
model = None
if HAS_SENTENCE_TRANSFORMERS:
    try:
        print(f"Preloading sentence-transformer model '{MODEL_NAME}'...")
        model = SentenceTransformer(MODEL_NAME)
        print("Model preloaded successfully.")
    except Exception as e:
        print(f"Error loading model: {e}. Falling back to mock model.")
        model = MockEmbeddingModel()
else:
    model = MockEmbeddingModel()

def embed_text(text: str) -> list[float]:
    """
    Returns the 384-dimensional embedding vector for the given text as a plain Python list of floats.
    """
    if isinstance(model, MockEmbeddingModel):
        embedding = model.encode(text)
    else:
        embedding = model.encode(text, show_progress_bar=False)
    
    if hasattr(embedding, "tolist"):
        return embedding.tolist()
    return [float(x) for x in embedding]
