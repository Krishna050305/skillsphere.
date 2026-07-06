import os
import numpy as np

# Try to import sentence_transformers, with fallback to mock if import fails
try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

class MockEmbeddingModel:
    def __init__(self):
        print("Using MockEmbeddingModel as fallback.")

    def encode(self, sentences, show_progress_bar=False):
        # Generate stable mock embeddings based on text length and character sums
        embeddings = []
        for text in sentences:
            np.random.seed(sum(ord(c) for c in text) % 2**32)
            # Create a mock 384-dimensional vector (dimension of all-MiniLM-L6-v2)
            vec = np.random.randn(384)
            # Normalize vector
            vec = vec / np.linalg.norm(vec)
            embeddings.append(vec.tolist())
        return np.array(embeddings)

class EmbeddingModelWrapper:
    def __init__(self):
        self.model = None
        self.model_name = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
        self.use_mock = os.getenv("USE_MOCK_ML", "false").lower() == "true"

    def load_model(self):
        if self.use_mock or not HAS_SENTENCE_TRANSFORMERS:
            self.model = MockEmbeddingModel()
            return

        try:
            print(f"Loading sentence-transformer model: {self.model_name}...")
            # Set caching directory to workspace to avoid re-downloading
            os.environ["HF_HOME"] = os.path.join(os.path.dirname(__file__), "..", ".hf_cache")
            self.model = SentenceTransformer(self.model_name)
            print("Model loaded successfully.")
        except Exception as e:
            print(f"Error loading model: {e}. Falling back to mock model.")
            self.model = MockEmbeddingModel()

    def get_embeddings(self, texts):
        if self.model is None:
            self.load_model()
        return self.model.encode(texts, show_progress_bar=False)

# Singleton instance
model_wrapper = EmbeddingModelWrapper()
