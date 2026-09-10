"""
Vector store management using FAISS (in-memory, local).
Handles embedding generation with sentence-transformers and
vector indexing/search operations.
"""
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Tuple
import threading

# Singleton model instance (loaded once at startup)
_model: SentenceTransformer | None = None
_model_lock = threading.Lock()

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384  # Dimension for all-MiniLM-L6-v2


def get_embedding_model() -> SentenceTransformer:
    """Load and cache the sentence-transformer model."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                print(f"[VectorStore] Loading embedding model: {MODEL_NAME}")
                _model = SentenceTransformer(MODEL_NAME)
                print("[VectorStore] Embedding model loaded successfully.")
    return _model


class VectorStore:
    """
    In-memory FAISS vector store with flat L2 index.
    Thread-safe for concurrent reads; writes use a lock.
    """

    def __init__(self):
        self.index = faiss.IndexFlatL2(EMBEDDING_DIM)
        self.next_id = 0
        self._lock = threading.Lock()
        print(f"[VectorStore] Initialized FAISS index (dim={EMBEDDING_DIM})")

    def embed_texts(self, texts: List[str]) -> np.ndarray:
        """Embed a list of texts into vectors."""
        model = get_embedding_model()
        embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
        return embeddings.astype(np.float32)

    def add_texts(self, texts: List[str]) -> List[int]:
        """
        Embed texts and add them to the FAISS index.
        Returns list of assigned FAISS indices.
        """
        if not texts:
            return []

        embeddings = self.embed_texts(texts)

        with self._lock:
            start_id = self.next_id
            self.index.add(embeddings)
            assigned_ids = list(range(start_id, start_id + len(texts)))
            self.next_id += len(texts)

        return assigned_ids

    def search(self, query: str, top_k: int = 5) -> List[Tuple[int, float]]:
        """
        Embed query and search FAISS index for nearest neighbors.
        Returns list of (faiss_index, distance) tuples.
        """
        if self.index.ntotal == 0:
            return []

        model = get_embedding_model()
        query_vec = model.encode([query], convert_to_numpy=True).astype(np.float32)

        k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(query_vec, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                results.append((int(idx), float(dist)))

        return results

    @property
    def total_vectors(self) -> int:
        return self.index.ntotal


# Global singleton vector store instance
_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    """Get or create the global vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
