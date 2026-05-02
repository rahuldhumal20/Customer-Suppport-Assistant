# 🤖 RAG-Based Customer Support Assistant

> Retrieval-Augmented Generation system for intelligent, scalable customer support — powered by LangGraph, ChromaDB, Groq, and React.

---

## 🚀 Overview

This project implements a production-grade **Retrieval-Augmented Generation (RAG)** system for automating e-commerce customer support.

It combines **vector search, LLM reasoning, workflow-based routing, and a React chat UI** to provide accurate responses — and gracefully escalates complex or low-confidence queries using **Human-in-the-Loop (HITL)**.

---

## 🎯 Problem Statement

Traditional customer support systems are:
- ⏳ Slow and inconsistent across agents
- 📉 Not scalable during traffic spikes
- 🧱 Knowledge locked in unread PDFs
- 🔄 No memory of prior conversations

This system solves all of these using **AI + retrieval-based architecture with confidence-aware routing**.

---

## 🧠 Key Features

| Feature | Description |
|---|---|
| 📄 PDF Knowledge Ingestion | Loads and chunks support manuals into ChromaDB |
| 🔍 Semantic Retrieval | Context-aware similarity search with source tracking |
| 🧭 Confidence-Based Routing | Intent + score + memory decide answer vs escalation |
| 🤖 LLM Responses | Groq `llama-3.3-70b-versatile` generates grounded answers |
| ⚠️ Uncertainty Detection | LLM self-doubt triggers automatic HITL escalation |
| 👨‍💻 HITL Escalation | Low-confidence queries logged to `human_review_queue.txt` |
| 🧠 Multi-Turn Memory | Conversation buffer with `clear_memory()` reset support |
| 🎨 React Chat UI | Dark/light mode, confidence pill, source tag, New Chat button |
| ⚡ FastAPI Backend | `POST /ask` + `POST /reset` with Swagger UI at `/docs` |

---

## 🏗️ System Architecture

### 1. Document Ingestion Pipeline *(Offline)*

```
PDF Knowledge Base
      │
 PyPDFLoader
      │
 RecursiveCharacterTextSplitter  ← 500 chars, 50 overlap
      │
 HuggingFace all-MiniLM-L6-v2   ← 384-dim embeddings
      │
 ChromaDB Vector Store
```

### 2. Query Processing Pipeline *(Online)*

```
User Query (React UI)
      │
 FastAPI  POST /ask
      │
 LangGraph Workflow
      │
 process_node  →  ChromaDB similarity search
      │
 Routing: intent + score + memory
      ├── score ≤ 1.8  →  answer_node  →  Groq LLM
      │                         │
      │                   uncertainty check
      │                         │ (if LLM unsure)
      └── score > 1.8  →  hitl_node  →  human_review_queue.txt
```

---

## 🔄 LangGraph Workflow

```
START
  │
process_node   ← retrieves context, detects intent, scores confidence
  │
  ├── route = "answer"  →  answer_node  →  Groq LLM  →  END
  │
  └── route = "hitl"   →  hitl_node   →  escalate   →  END
```

### Routing Decision Logic

| Condition | Route |
|---|---|
| `intent == unknown` AND memory empty | → HITL |
| `score > 1.8` AND memory empty | → HITL |
| LLM response contains uncertainty phrases | → HITL (from answer_node) |
| `score ≤ 1.8` OR memory has prior turns | → Answer Node |

---

## 🧩 Project Structure

```
rag-customer-support/
│
├── app/
│   ├── loader.py        # PDF loading + text chunking
│   ├── embedder.py      # Embedding generation + ChromaDB storage
│   ├── retriever.py     # Similarity search + reranking + source extraction
│   ├── graph.py         # LangGraph 3-node workflow + AgentState
│   ├── hitl.py          # Human escalation + queue logging
│   ├── memory.py        # Conversation buffer + clear_memory()
│   ├── main.py          # FastAPI endpoints: POST /ask, POST /reset
│   └── config.py        # API keys, model name, paths
│
├── frontend/            # React + Vite chat UI
│   └── src/
│       └── App.jsx      # Dark/light mode, confidence pill, New Chat
│
├── data/
│   └── customer_support_manual.pdf
│
├── chroma_db/           # Auto-generated vector store
├── human_review_queue.txt
├── requirements.txt
├── .env
└── README.md
```

---

## ⚙️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Python 3.10+ | Core language |
| FastAPI | REST API (`POST /ask`, `POST /reset`) |
| LangChain | Document loaders, text splitters |
| LangGraph | Stateful 3-node workflow graph |
| ChromaDB | Local vector database |
| HuggingFace `all-MiniLM-L6-v2` | Free offline embeddings |
| Groq `llama-3.3-70b-versatile` | LLM inference (< 1s) |
| Uvicorn | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | Chat UI framework |
| Inline CSS (no library) | Dark/light mode theming |

---

## 🧪 API Reference

### `POST /ask` — Submit a query

**Request**
```json
{
  "query": "What is your refund policy?"
}
```

**Response — Confident answer**
```json
{
  "query": "What is your refund policy?",
  "answer": "Refunds are processed within 5-7 business days.",
  "confidence": 0.82,
  "source": "Customer Support Manual"
}
```

**Response — HITL escalation**
```json
{
  "query": "How does your enterprise SLA work?",
  "answer": "Escalation Triggered. Ticket added to Human Review Queue.",
  "confidence": 0.0,
  "source": "HITL"
}
```

---

### `POST /reset` — Clear conversation memory

**Response**
```json
{
  "message": "Conversation reset"
}
```

> Clears the in-memory conversation buffer via `clear_memory()` in `memory.py`. Called automatically by the **New Chat** button in the React UI.

---

### `GET /` — Health check

```json
{
  "message": "RAG Customer Support API Running"
}
```

---

## 🖥️ Run Locally

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/rag-customer-support.git
cd rag-customer-support
```

### 2. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 5. Run the Backend

```bash
uvicorn app.main:app --reload
```

### 6. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 7. Open in Browser

| Service | URL |
|---|---|
| React Chat UI | `http://localhost:5173` |
| FastAPI Swagger Docs | `http://127.0.0.1:8000/docs` |

---

## 🎨 React UI Features

- 🌙 / ☀️ **Dark / Light mode** toggle
- 💬 **Suggested query chips** on first load
- ⌨️ **Typing indicator** (animated dots while waiting)
- ✅ **Confidence pill** — green (≥ 60%) or amber (< 60%) below every bot response
- 📄 **Source tag** — shows which document the answer came from
- ⚠️ **HITL badge** — yellow warning when query is escalated
- 🔄 **New Chat button** — clears memory and resets the conversation
- ↩️ **Enter to send**, Shift+Enter for newline

---

## 🧠 Design Decisions

| Decision | Rationale |
|---|---|
| Chunk size = 500 chars | Balances context quality vs retrieval precision |
| Overlap = 50 chars | Prevents context loss at chunk boundaries |
| HuggingFace embeddings | Free, offline, strong semantic similarity |
| ChromaDB | Lightweight local vector DB, zero infrastructure cost |
| LangGraph | Stateful conditional routing, clean node separation |
| Groq LLM | Free tier, < 1s inference, strong quality |
| score threshold = 1.8 | Empirically tuned for `all-MiniLM-L6-v2` L2 space |
| Uncertainty detection | Catches cases where routing passed but LLM lacks context |

---

## ⚠️ Known Limitations

- Single PDF knowledge base (multi-doc planned)
- File-based HITL queue (not production-scalable)
- In-memory conversation buffer (lost on server restart)
- Keyword-based intent detection (paraphrase-sensitive)
- Groq free-tier rate limits under high load

---

## 🚀 Future Enhancements

- [ ] Multi-document ingestion with metadata filtering
- [ ] Ticket system integration (Zendesk / Jira) for HITL
- [ ] Persistent session memory (Redis / PostgreSQL)
- [ ] ML-based intent classifier (fine-tuned DistilBERT)
- [ ] WebSocket streaming for real-time token display
- [ ] User authentication (JWT / OAuth2)
- [ ] Cloud deployment (Docker + Render / AWS EC2)
- [ ] Admin monitoring dashboard

---

## 📌 Author

**Rahul Pravin Dhumal**
Intern ID: `IN226095102`

---

*Built with LangChain · LangGraph · ChromaDB · Groq · HuggingFace · FastAPI · React*