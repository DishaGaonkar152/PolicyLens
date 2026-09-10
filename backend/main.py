"""
FastAPI application entry point for the Document Q&A RAG Assistant.
Provides endpoints for document ingestion, Q&A, and document management.
"""
import os
import sys
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from typing import List, Optional

# Ensure backend directory is in sys.path
sys.path.insert(0, str(Path(__file__).parent.resolve()))


from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import init_db, get_db, Document, Chunk
from vector_store import get_vector_store, get_embedding_model
from ingestion import ingest_document
from llm import generate_answer

load_dotenv()

# ---------------------------------------------------------------------------
# Startup: seed sample documents + load embedding model
# ---------------------------------------------------------------------------

SAMPLE_DOCS_DIR = Path(__file__).parent / "sample_docs"

SAMPLE_DOC_META = {
    "hr_policy.md": {
        "name": "HR Policy Manual",
        "description": "ACME Corporation Human Resources Policy Manual v3.2 — covers employment, compensation, leave, and conduct policies.",
    },
    "it_sop.md": {
        "name": "IT Security & Operations SOP",
        "description": "IT-SOP-001 — IT security standards, access management, device policies, and incident response procedures.",
    },
    "employee_onboarding_guide.md": {
        "name": "Employee Onboarding Guide",
        "description": "New employee onboarding guide covering Day 1 activities, mandatory training, 30/60/90-day goals, and resources.",
    },
    "engineering_handbook.md": {
        "name": "Engineering Handbook",
        "description": "Product Engineering handbook covering code standards, CI/CD, deployment windows, on-call, and architecture guidelines.",
    },
}


def sync_db_with_faiss(db: Session):
    """
    Ensure all chunks in SQLite are properly indexed in the in-memory FAISS store.
    Also ingest any sample documents that are missing.
    """
    vs = get_vector_store()

    # 1. First seed any missing sample documents
    for filename, meta in SAMPLE_DOC_META.items():
        existing = db.query(Document).filter(
            Document.original_filename == filename,
            Document.is_seeded == True  # noqa: E712
        ).first()

        if not existing:
            file_path = SAMPLE_DOCS_DIR / filename
            if not file_path.exists():
                print(f"[Seed] Sample file not found: {file_path}")
                continue

            content = file_path.read_bytes()
            print(f"[Seed] Ingesting new sample document: {meta['name']}")
            _, chunks = ingest_document(filename, content, meta["name"])

            if not chunks:
                continue

            doc = Document(
                name=meta["name"],
                original_filename=filename,
                file_type=Path(filename).suffix.lower().lstrip("."),
                total_chunks=len(chunks),
                is_seeded=True,
                description=meta["description"],
            )
            db.add(doc)
            db.flush()

            for chunk_data in chunks:
                chunk = Chunk(
                    document_id=doc.id,
                    document_name=meta["name"],
                    chunk_index=chunk_data["chunk_index"],
                    faiss_index=-1,  # Will be assigned during reindexing below
                    text=chunk_data["text"],
                    section_title=chunk_data["section_title"],
                    token_count=chunk_data["token_count"],
                )
                db.add(chunk)
            db.commit()

    # 2. Re-index all chunks from SQLite into FAISS if FAISS is empty
    if vs.total_vectors == 0:
        all_chunks = db.query(Chunk).order_by(Chunk.id).all()
        if all_chunks:
            print(f"[Startup] Indexing {len(all_chunks)} chunks from SQLite into FAISS...")
            texts = [c.text for c in all_chunks]
            faiss_ids = vs.add_texts(texts)
            for chunk, fid in zip(all_chunks, faiss_ids):
                chunk.faiss_index = fid
            db.commit()
            print(f"[Startup] Total FAISS vectors ready: {vs.total_vectors}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    print("[Startup] Initializing database...")
    init_db()

    print("[Startup] Loading embedding model (this may take a moment)...")
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, get_embedding_model)

    print("[Startup] Synchronizing documents with FAISS...")
    from database import SessionLocal
    db = SessionLocal()
    try:
        sync_db_with_faiss(db)
    finally:
        db.close()

    print("[Startup] Ready!")
    yield
    print("[Shutdown] Goodbye.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Document Q&A RAG Assistant",
    description="Enterprise Document Q&A powered by RAG (FAISS + Groq LLM)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class QuestionRequest(BaseModel):
    question: str
    top_k: int = 5
    language: Optional[str] = "English"


class SourceChunk(BaseModel):
    document_name: str
    section_title: str
    text: str
    relevance_score: float
    chunk_index: int


class QuestionResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    question: str
    language: str = "English"


class DocumentResponse(BaseModel):
    id: int
    name: str
    original_filename: str
    file_type: str
    total_chunks: int
    is_seeded: bool
    description: Optional[str]
    created_at: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    vs = get_vector_store()
    return {
        "status": "healthy",
        "total_vectors": vs.total_vectors,
        "groq_key_set": bool(os.getenv("GROQ_API_KEY")),
    }


@app.get("/api/documents", response_model=List[DocumentResponse])
async def list_documents(db: Session = Depends(get_db)):
    """List all indexed documents."""
    docs = db.query(Document).order_by(Document.created_at.desc()).all()
    return [
        DocumentResponse(
            id=doc.id,
            name=doc.name,
            original_filename=doc.original_filename,
            file_type=doc.file_type,
            total_chunks=doc.total_chunks,
            is_seeded=doc.is_seeded,
            description=doc.description,
            created_at=doc.created_at.isoformat(),
        )
        for doc in docs
    ]


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Upload and index a new document (.txt, .pdf, or .md)."""
    allowed_types = {".txt", ".pdf", ".md"}
    ext = Path(file.filename).suffix.lower()

    if ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_types)}"
        )

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit.")

    # Use filename without extension as document name
    doc_name = Path(file.filename).stem.replace("_", " ").replace("-", " ").title()

    # Check for duplicate
    existing = db.query(Document).filter(
        Document.original_filename == file.filename
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"A document with filename '{file.filename}' already exists."
        )

    # Ingest
    try:
        _, chunks = ingest_document(file.filename, content, doc_name)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to process document: {str(e)}")

    if not chunks:
        raise HTTPException(status_code=422, detail="No text could be extracted from this file.")

    # Embed and index
    vs = get_vector_store()
    texts = [c["text"] for c in chunks]
    faiss_ids = vs.add_texts(texts)

    # Save to DB
    doc = Document(
        name=doc_name,
        original_filename=file.filename,
        file_type=ext.lstrip("."),
        total_chunks=len(chunks),
        is_seeded=False,
    )
    db.add(doc)
    db.flush()

    for chunk_data, faiss_id in zip(chunks, faiss_ids):
        chunk = Chunk(
            document_id=doc.id,
            document_name=doc_name,
            chunk_index=chunk_data["chunk_index"],
            faiss_index=faiss_id,
            text=chunk_data["text"],
            section_title=chunk_data["section_title"],
            token_count=chunk_data["token_count"],
        )
        db.add(chunk)

    db.commit()

    return {
        "message": f"Document '{doc_name}' indexed successfully.",
        "document_id": doc.id,
        "chunks_created": len(chunks),
        "document_name": doc_name,
    }


@app.delete("/api/documents/{doc_id}")
async def delete_document(doc_id: int, db: Session = Depends(get_db)):
    """Delete a document and its chunks from the database."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    db.query(Chunk).filter(Chunk.document_id == doc_id).delete()
    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.name}' deleted successfully."}


@app.post("/api/ask", response_model=QuestionResponse)
async def ask_question(
    request: QuestionRequest,
    db: Session = Depends(get_db),
):
    """
    Main RAG endpoint: embed question → retrieve top chunks → generate grounded answer.
    """
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if len(question) > 1000:
        raise HTTPException(status_code=400, detail="Question too long (max 1000 chars).")

    vs = get_vector_store()
    if vs.total_vectors == 0:
        raise HTTPException(
            status_code=503,
            detail="No documents have been indexed yet. Please upload documents first."
        )

    # 1. Retrieve top-k chunks from FAISS
    top_k = min(request.top_k, 10)
    search_results = vs.search(question, top_k=top_k)

    if not search_results:
        raise HTTPException(status_code=503, detail="Could not retrieve relevant chunks.")

    # 2. Fetch chunk metadata from SQLite
    faiss_indices = [idx for idx, _ in search_results]
    distance_map = {idx: dist for idx, dist in search_results}

    chunks_db = db.query(Chunk).filter(
        Chunk.faiss_index.in_(faiss_indices)
    ).all()

    # Sort by relevance (FAISS distance — lower is better)
    chunks_db.sort(key=lambda c: distance_map.get(c.faiss_index, float("inf")))

    # Build context list for LLM
    context_chunks = [
        {
            "document_name": c.document_name,
            "section_title": c.section_title or "General",
            "text": c.text,
        }
        for c in chunks_db
    ]

    # 3. Generate answer with Groq LLM
    target_lang = request.language or "English"
    try:
        answer = generate_answer(question, context_chunks, target_language=target_lang)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {str(e)}")

    # 4. Build source list for response
    # Normalize distance to a 0–1 relevance score (closer = higher score)
    max_dist = max((distance_map.get(c.faiss_index, 1) for c in chunks_db), default=1)
    sources = [
        SourceChunk(
            document_name=c.document_name,
            section_title=c.section_title or "General",
            text=c.text[:600] + ("..." if len(c.text) > 600 else ""),
            relevance_score=round(
                max(0.0, 1.0 - distance_map.get(c.faiss_index, max_dist) / (max_dist + 1e-9)),
                3
            ),
            chunk_index=c.chunk_index,
        )
        for c in chunks_db
    ]

    return QuestionResponse(
        answer=answer,
        sources=sources,
        question=question,
        language=target_lang,
    )


# ---------------------------------------------------------------------------
# Serve React frontend (built static files)
# ---------------------------------------------------------------------------

FRONTEND_BUILD = Path(__file__).parent.parent / "frontend" / "dist"

if FRONTEND_BUILD.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_BUILD / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        index_file = FRONTEND_BUILD / "index.html"
        if index_file.exists():
            return FileResponse(str(index_file))
        return JSONResponse({"message": "Frontend not built yet. Run: cd frontend && npm run build"})
else:
    @app.get("/", include_in_schema=False)
    async def root():
        return {"message": "Backend is running. Build the frontend with: cd frontend && npm run build"}
