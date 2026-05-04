from typing import TypedDict
from langgraph.graph import StateGraph
from langchain_groq import ChatGroq
from app.config import GROQ_API_KEY, MODEL_NAME , SIMILARITY_THRESHOLD
from app.retriever import retrieve_context
from app.hitl import escalate_to_human
from app.memory import get_memory_context, save_to_memory

llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=MODEL_NAME
)

# ── Phrases that signal the LLM is uncertain ──────

uncertainty_phrases = [
    "not confident","context does not",
    "does not provide","no information",
    "cannot answer","not sure",
    "don't have","i don't know",
    "unable to answer",
]

class AgentState(TypedDict):
    query: str
    context: str
    route: str
    response: str
    source: str
    score: float
    confidence: float

# ── Node 1: Process ───────────────────────────────

def process_node(state: AgentState) -> dict:

    query  = state["query"].lower()

    result = retrieve_context(query)

    context, score, source = result["context"], result["score"], result["source"]
 
    if   any(k in query for k in ("password", "account", "login")):
        intent = "account"
    elif any(k in query for k in ("order", "shipping", "arrive", "delivery")):
        intent = "order"
    elif any(k in query for k in ("refund", "return", "cancel")):
        intent = "refund"
    elif any(k in query for k in ("payment", "deducted", "billing")):
        intent = "payment"
    else: intent = "unknown"
 
    memory = get_memory_context()

    route  = "hitl" if (
        (intent == "unknown" and not memory.strip()) or
        (score > SIMILARITY_THRESHOLD and not memory.strip())
    ) else "answer"
 
    return {
        "query": query,
        "context": context,
        "route": route,
        "response": "",
        "source": source,
        "score": score,
        "confidence": 0.0
    }

# ── Node 2: Answer ────────────────────────────────

def answer_node(state):

    memory = get_memory_context()

    prompt = f"""
    You are a professional customer support assistant.

    Rules:
    - Answer ONLY using the provided context
    - Be clear and concise
    - If unsure, say you are not confident

    Previous Conversation:
    {memory}

    Context:
    {state['context']}

    Question:
    {state['query']}

    Answer:
    """

    try:
        result = llm.invoke(prompt)

        
        if any(phrase in result.content.lower() for phrase in uncertainty_phrases):
            escalation_response = escalate_to_human(state["query"])
            return {
                "query": state["query"],
                "context": state["context"],
                "route": "hitl",
                "response": escalation_response
            }

        save_to_memory(state["query"], result.content)

        confidence = round(1 / (1 + state["score"]), 2)

        return {
            "query": state["query"],
            "context": state["context"],
            "route": "answer",
            "response": result.content,
            "confidence": confidence,
            "source": state["source"]
        }

    except Exception as e:
        print(f"LLM Error: {e}")
        return {"response": "We are experiencing technical difficulties. Please try again later."}

# ── Node 3: HITL ──────────────────────────────────


def hitl_node(state):
    return {
        "query": state["query"],
        "context": state["context"],
        "route": "hitl",
        "response": escalate_to_human(state["query"]),
        "confidence": 0.0,
        "source": "HITL"
}

def route_decision(state):
    return state["route"]


builder = StateGraph(AgentState)

builder.add_node("process", process_node)
builder.add_node("answer", answer_node)
builder.add_node("hitl", hitl_node)

builder.set_entry_point("process")

builder.add_conditional_edges(
    "process",
    route_decision,
    {
        "answer": "answer",
        "hitl": "hitl"
    }
)

builder.set_finish_point("answer")
builder.set_finish_point("hitl")

app_graph = builder.compile()