# DocuAI — Document Q&A Assistant with RAG

> **Enterprise-grade Document Intelligence** — Ask natural language questions, get answers grounded in your company's documents with full source citations.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          BROWSER                                 │
│  React (Vite) ──► Chat UI ──► Sidebar ──► Sources Panel         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (REST)
┌────────────────────────────▼────────────────────────────────────┐
│                       FastAPI Backend                            │
│                                                                  │
│   /api/ask ──► FAISS Search ──► SQLite Lookup ──► Groq LLM     │
│   /api/documents/upload ──► Chunk ──► Embed ──► FAISS + SQLite  │
│   /api/documents ──► List all indexed documents                  │
└─────────────┬──────────────────────┬───────────────────────────┘
              │                      │
     ┌────────▼───────┐    ┌─────────▼────────┐
     │  FAISS Index   │    │  SQLite Database  │
     │  (in-memory)   │    │  (persistent)     │
     │  all-MiniLM    │    │  docs + chunks    │
     └────────────────┘    └──────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | FastAPI (Python 3.11+) |
| Vector Store | FAISS (in-memory, flat L2) |
| Embeddings | sentence-transformers `all-MiniLM-L6-v2` (local, no API key) |
| LLM | Groq API — `llama-3.1-8b-instant` |
| Database | SQLite via SQLAlchemy |
| Frontend | React 18 + Vite |
| Chunking | tiktoken (500 tokens, 50 overlap) |

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A free Groq API key ([get one here](https://console.groq.com))

### 1. Set your Groq API key

Edit `backend/.env`:
```env
GROQ_API_KEY=gsk_your_actual_key_here
```

### 2. Install & Setup (first time only)

```bat
setup.bat
```

This installs Python packages, npm packages, and builds the frontend.

### 3. Run the app

**Production mode** (frontend served by FastAPI):
```bat
start.bat
```
Open → **http://localhost:8000**

**Development mode** (hot reload on both sides):
```bat
start_dev.bat
```
Open → **http://localhost:5173**

---

## Features

### ✅ Document Ingestion
- Upload `.txt`, `.pdf`, `.md` files (up to 10MB)
- Drag & drop supported
- Auto-chunked to 500-token chunks with 50-token overlap
- Section titles detected automatically
- Embedded with `all-MiniLM-L6-v2` (runs locally, no API key)

### ✅ RAG Question-Answering
- Semantic vector search via FAISS (top-5 chunks)
- Strict prompt: "Answer ONLY from context, cite sources"
- Returns answer + cited chunks with relevance scores
- Falls back gracefully when answer not in documents

### ✅ Chat UI
- Professional enterprise dark theme (blue/gray palette)
- Typing indicator, message bubbles, auto-scroll
- Expandable "Sources" panel per answer
- Suggested questions on welcome screen
- Toast notifications for upload/delete

### ✅ Pre-seeded Sample Documents
| Document | Content |
|----------|---------|
| HR Policy Manual | PTO, benefits, leave, conduct, performance |
| IT Security SOP | Passwords, MFA, VPN, incident response |
| Employee Onboarding Guide | Day 1, 30/60/90-day plan, tools, resources |
| Engineering Handbook | Code standards, CI/CD, deployment, on-call |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check + vector count |
| GET | `/api/documents` | List all indexed documents |
| POST | `/api/documents/upload` | Upload and index a document |
| DELETE | `/api/documents/{id}` | Remove a document |
| POST | `/api/ask` | Ask a question (RAG) |

### POST `/api/ask` — Request
```json
{
  "question": "What is the parental leave policy?",
  "top_k": 5
}
```

### POST `/api/ask` — Response
```json
{
  "question": "What is the parental leave policy?",
  "answer": "Primary caregivers receive 16 weeks... [Source: HR Policy Manual, Section: Parental Leave]",
  "sources": [
    {
      "document_name": "HR Policy Manual",
      "section_title": "Parental Leave",
      "text": "ACME Corporation provides...",
      "relevance_score": 0.92,
      "chunk_index": 14
    }
  ]
}
```

---

## Project Structure

```
chatbot_rag/
├── backend/
│   ├── main.py              # FastAPI app + routes + startup seeding
│   ├── database.py          # SQLAlchemy models (Document, Chunk)
│   ├── vector_store.py      # FAISS index + sentence-transformers
│   ├── ingestion.py         # Text extraction + chunking
│   ├── llm.py               # Groq API client + RAG prompt
│   ├── requirements.txt
│   ├── .env                 # ← Add GROQ_API_KEY here
│   └── sample_docs/
│       ├── hr_policy.md
│       ├── it_sop.md
│       ├── employee_onboarding_guide.md
│       └── engineering_handbook.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Full SPA (chat + sidebar + sources)
│   │   ├── index.css        # Global styles
│   │   └── main.jsx         # React entry
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── setup.bat                # First-time setup
├── start.bat                # Production launch
└── start_dev.bat            # Development with hot reload
```

---

## Troubleshooting

**"GROQ_API_KEY not set"** — Edit `backend/.env`, replace the placeholder with your real key.

**Slow first start** — Normal. The sentence-transformers model (~90MB) downloads on first run and is cached locally.

**Port 8000 in use** — Change the port in `start.bat`: `uvicorn main:app --port 8080`

**FAISS not found** — Ensure you installed `faiss-cpu`, not `faiss-gpu` (unless you have CUDA).
