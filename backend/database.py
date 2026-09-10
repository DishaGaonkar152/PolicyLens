"""
Database models and initialization for the RAG Document Q&A system.
Uses SQLite via SQLAlchemy for storing document metadata and chunks.
"""
from pathlib import Path
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, Float, Boolean
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DB_PATH = (Path(__file__).parent / "rag_documents.db").resolve()
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    total_chunks = Column(Integer, default=0)
    is_seeded = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    description = Column(Text, nullable=True)


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, nullable=False, index=True)
    document_name = Column(String(255), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    faiss_index = Column(Integer, nullable=False, index=True)
    text = Column(Text, nullable=False)
    section_title = Column(String(255), nullable=True)
    token_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
