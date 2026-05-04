from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from app.loader import load_and_chunk
from app.config import CHROMA_PATH, EMBEDDING_MODEL

def build_vector_store():
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)
    db = Chroma.from_documents(
        load_and_chunk(),
        embeddings,
        persist_directory=CHROMA_PATH
    )
    db.persist()
    print("Embeddings stored in ChromaDB")