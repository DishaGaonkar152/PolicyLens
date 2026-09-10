"""
Production entrypoint for PolicyLens RAG Assistant.
Reads PORT and HOST from environment variables, defaulting to 0.0.0.0:8000.
"""
import os
import sys
from pathlib import Path
import uvicorn

# Ensure backend directory is in sys.path
backend_dir = (Path(__file__).parent / "backend").resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting PolicyLens on {host}:{port}...")
    uvicorn.run("backend.main:app", host=host, port=port)
