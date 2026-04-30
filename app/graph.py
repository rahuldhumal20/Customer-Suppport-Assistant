from typing import TypedDict
from langgraph.graph import StateGraph

from langchain_groq import ChatGroq

from app.config import GROQ_API_KEY, MODEL_NAME
from app.retriever import retrieve_context
from app.hitl import escalate_to_human
from app.memory import get_memory_context, save_to_memory

llm = ChatGroq(
    groq_api_key=GROQ_API_KEY,
    model_name=MODEL_NAME
)

class AgentState(TypedDict):
    query: str
    context: str
    route: str
    response: str
    source: str
    score: float


def process_node(state):

    query = state["query"].lower()
    result = retrieve_context(query)
    context = result["context"]
    score = result["score"]
    source = result.get("source", "Unknown")

    if "password" in query or "account" in query:
        intent = "account"
    elif "order" in query or "shipping" in query:
        intent = "order"
    elif "refund" in query or "return" in query or "cancel" in query:
        intent = "refund"
    elif "payment" in query or "deducted" in query:
        intent = "payment"
    elif "arrive" in query or "delivery" in query:
        intent = "order"
    else:
        intent = "unknown"

    memory = get_memory_context()

    if intent == "unknown" and memory.strip() == "":
        return {"query": query, "context": context, "route": "hitl", "response": ""}

    if score > 1.8 and memory.strip() == "":
        return {"query": query, "context": context, "route": "hitl", "response": ""}

    return {
        "query": query,
        "context": context,
        "route": "answer",
        "response": "",
        "source": source,
        "score": score
    }


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

        # If the LLM admits it doesn't know, escalate to HITL and write the txt
        uncertainty_phrases = [
            "not confident",
            "context does not",
            "does not provide",
            "no information",
            "cannot answer",
            "not sure",
            "don't have",
            "i don't know",
            "unable to answer",
        ]
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