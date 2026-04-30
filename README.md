# 🤖 RAG-Based Customer Support Assistant

## 🚀 Overview
This project implements a **Retrieval-Augmented Generation (RAG)** system for intelligent customer support.

It combines **vector search, LLM reasoning, and workflow-based routing** to provide accurate responses and escalate complex queries using **Human-in-the-Loop (HITL)**.

---

## 🎯 Problem Statement
Traditional customer support systems are:
- Slow and inconsistent  
- Not scalable  
- Lack contextual understanding  

This system solves these issues using **AI + retrieval-based architecture**.

---

## 🧠 Key Features

- 📄 PDF-based knowledge ingestion  
- 🔍 Context-aware retrieval using ChromaDB  
- 🧭 Intent + confidence-based routing  
- 🧠 Multi-turn conversation memory  
- 🤖 LLM-powered responses (Groq)  
- 👨‍💻 Human-in-the-Loop escalation system  
- ⚡ FastAPI backend with Swagger UI  

---

## 🏗️ System Architecture

### 1. Document Ingestion Pipeline
- Load PDF documents  
- Split into chunks (500 chars, overlap 50)  
- Generate embeddings (HuggingFace)  
- Store in ChromaDB  

### 2. Query Processing Pipeline
- User query via FastAPI  
- LangGraph workflow execution  
- Retrieve relevant context  
- Routing decision (answer / HITL)  
- Generate response using LLM  

---

## 🔄 Workflow
User Query → Retriever → Routing Logic → LLM Response (if confident)→ HITL Escalation (if low confidence)


---

## 🧩 Project Structure
app/
├── loader.py # PDF loading + chunking
├── embedder.py # Embedding generation + storage
├── retriever.py # Similarity search
├── graph.py # LangGraph workflow
├── hitl.py # Human escalation logic
├── memory.py # Conversation memory
├── main.py # FastAPI entrypoint
└── config.py # Configuration

data/
├── customer_support_manual.pdf

chroma_db/
human_review_queue.txt


---

## ⚙️ Tech Stack

- Python  
- FastAPI  
- LangChain  
- LangGraph  
- ChromaDB  
- HuggingFace Embeddings  
- Groq LLM  

---

## 🧪 API Usage

### Endpoint

POST /ask


### Example Request
```json
{
  "query": "What is refund policy?"
}

Example Response
{
  "response": "Refunds are processed within 5-7 business days."
}
```
---

## Run Locally

1. Clone Repository

git clone https://github.com/your-username/rag-customer-support.git

cd rag-customer-support

2. Create Virtual Environment

python -m venv venv
venv\Scripts\activate

3. Install Dependencies

pip install -r requirements.txt

4. Set Environment Variables

Create .env file:

GROQ_API_KEY=your_api_key_here

5. Run Server

uvicorn app.main:app --reload

6. Open API Docs

http://127.0.0.1:8000/docs

## 🧠 Design Decisions

1. Chunk size = 500 (balanced context + precision)
2. HuggingFace embeddings (free & efficient)
3. ChromaDB for fast local vector search
4. LangGraph for workflow-based routing


## ⚠️ Challenges
Balancing retrieval accuracy vs speed
Choosing optimal chunk size
Handling multi-turn queries
Designing reliable routing logic


## 🚀 Future Enhancements
React-based chat UI
Database-based HITL system
Authentication (JWT/OAuth)
Cloud deployment (Render/AWS)
Real-time streaming responses


## 📌 Author

Rahul Dhumal
M.Sc Computer Applications