from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.embedder import build_vector_store
from app.graph import app_graph
from app.memory import clear_memory

app = FastAPI(title="RAG Customer Support API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Building Vector DB...")
build_vector_store()


class QueryRequest(BaseModel):
    query: str


@app.get("/")
def home():
    return {"message": "RAG Customer Support API Running"}


@app.post("/ask")
def ask_question(data: QueryRequest):
    result = app_graph.invoke({
        "query": data.query, "context": "",
        "route": "",         "response": "",
        "source": "",        "score": 0.0, "confidence": 0.0
    })
    return {
        "query":      data.query,
        "answer":     result["response"],
        "confidence": result.get("confidence", 0.0),
        "source":     result.get("source", "")
    }


@app.post("/reset")
def reset():
    clear_memory()
    return {"message": "Conversation reset"}