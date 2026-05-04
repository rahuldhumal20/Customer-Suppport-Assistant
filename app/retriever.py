from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from app.config import CHROMA_PATH, EMBEDDING_MODEL, TOP_K

# ── Load once at import time ───────────────────────
_db = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
)

def retrieve_context(query: str) -> dict:
    results = sorted(
        _db.similarity_search_with_score(query, k=TOP_K),
        key=lambda x: x[1]          # lower score = better match
    )[:3]                            # keep best 3

    context = "\n\n".join(doc.page_content for doc, _ in results)
    scores  = [score for _, score in results]
    avg_score = sum(scores) / len(scores) if scores else 1.0
    source  = next(
        (doc.metadata["source"] for doc, _ in results if "source" in doc.metadata),
        "Customer Support Manual"
    )
    return {"context": context, "score": avg_score, "source": source}