import os
from dotenv import load_dotenv

load_dotenv()

# ── Groq LLM ──────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME   = "llama-3.3-70b-versatile"

# ── ChromaDB ──────────────────────────────────────
CHROMA_PATH  = "chroma_db"

# ── Embeddings ────────────────────────────────────
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# ── Retrieval ─────────────────────────────────────
TOP_K                = 5
SIMILARITY_THRESHOLD = 1.8

# ── Knowledge Base ────────────────────────────────
PDF_PATH = "data/customer_support_manual.pdf"

# ── HITL Queue ────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
QUEUE_FILE = os.path.join(BASE_DIR, "..", "human_review_queue.txt")