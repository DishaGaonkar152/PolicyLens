"""
Document ingestion: text extraction, chunking, and indexing pipeline.
Supports .txt, .pdf, and .md files.
Uses tiktoken for token-accurate chunking (500 tokens, 50 overlap).
"""
import re
import tiktoken
from pathlib import Path
from typing import List, Tuple
import pypdf

CHUNK_SIZE = 500      # tokens per chunk
CHUNK_OVERLAP = 50   # overlapping tokens between chunks

# Use cl100k_base tokenizer (compatible with most models)
_tokenizer = tiktoken.get_encoding("cl100k_base")


# ---------------------------------------------------------------------------
# Text extraction
# ---------------------------------------------------------------------------

def extract_text_from_txt(content: bytes) -> str:
    """Extract text from .txt or .md file bytes."""
    return content.decode("utf-8", errors="replace")


def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF file bytes using pypdf."""
    import io
    reader = pypdf.PdfReader(io.BytesIO(content))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages.append(text)
    return "\n\n".join(pages)


def extract_text(filename: str, content: bytes) -> str:
    """Dispatch text extraction based on file extension."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        return extract_text_from_pdf(content)
    else:  # .txt, .md, and anything else treated as plain text
        return extract_text_from_txt(content)


# ---------------------------------------------------------------------------
# Section detection (lightweight heuristic)
# ---------------------------------------------------------------------------

def detect_section(text_before: str, window: int = 300) -> str:
    """
    Try to identify the section title nearest to the chunk start
    by looking backward in the preceding text.
    """
    snippet = text_before[-window:]
    # Match markdown headings or ALL-CAPS lines
    headings = re.findall(
        r"(?:^|\n)(#{1,3}\s+.+|[A-Z][A-Z\s\-]{4,}[A-Z])\s*\n",
        snippet
    )
    if headings:
        title = headings[-1].strip().lstrip("#").strip()
        # Truncate long titles
        return title[:80] if len(title) > 80 else title
    return "General"


# ---------------------------------------------------------------------------
# Chunking
# ---------------------------------------------------------------------------

def chunk_text(text: str, doc_name: str) -> List[dict]:
    """
    Split text into overlapping token-based chunks.
    Returns list of dicts: {text, chunk_index, section_title, token_count}
    """
    # Clean up excessive whitespace
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    tokens = _tokenizer.encode(text)
    total_tokens = len(tokens)

    if total_tokens == 0:
        return []

    chunks = []
    start = 0
    chunk_index = 0

    while start < total_tokens:
        end = min(start + CHUNK_SIZE, total_tokens)
        chunk_tokens = tokens[start:end]
        chunk_text_str = _tokenizer.decode(chunk_tokens)

        # Approximate character offset for section detection
        char_start = len(_tokenizer.decode(tokens[:start]))
        section = detect_section(text[:char_start])

        chunks.append({
            "text": chunk_text_str.strip(),
            "chunk_index": chunk_index,
            "section_title": section,
            "token_count": len(chunk_tokens),
        })

        chunk_index += 1
        if end == total_tokens:
            break
        start = end - CHUNK_OVERLAP

    return chunks


# ---------------------------------------------------------------------------
# High-level ingestion pipeline
# ---------------------------------------------------------------------------

def ingest_document(
    filename: str,
    content: bytes,
    doc_name: str,
) -> Tuple[str, List[dict]]:
    """
    Extract text from file and return (raw_text, chunks_list).
    Each chunk dict: {text, chunk_index, section_title, token_count}
    """
    raw_text = extract_text(filename, content)
    chunks = chunk_text(raw_text, doc_name)
    return raw_text, chunks
