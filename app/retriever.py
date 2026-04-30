from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from app.config import CHROMA_PATH

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

db = Chroma(
    persist_directory=CHROMA_PATH,
    embedding_function=embeddings
)


def retrieve_context(query):

    results = db.similarity_search_with_score(
        query,
        k=5
    )

    # sort by score (lower = better match)
    results = sorted(results, key=lambda x: x[1])

    # keep best 3
    top_results = results[:3]

    context = []
    scores = []
    source = "Customer Support Manual"   # default

    for doc, score in top_results:
        context.append(doc.page_content)
        scores.append(score)

        #try extracting source from metadata
        if "source" in doc.metadata:
            source = doc.metadata["source"]

    # avoid division error
    avg_score = sum(scores) / len(scores) if scores else 1.0

    return {
        "context": "\n\n".join(context),   # cleaner formatting
        "score": avg_score,
        "source": source                  
    }