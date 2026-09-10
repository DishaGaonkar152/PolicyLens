# =========================================================
# Stage 1: Build React Frontend
# =========================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# =========================================================
# Stage 2: Python Backend & Production Runtime
# =========================================================
FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0 \
    MALLOC_TRIM_THRESHOLD_=100000

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# 1. Install ultra-lightweight CPU-ONLY PyTorch first!
# This avoids downloading 5GB+ of NVIDIA CUDA / cuDNN wheels and stays well within Render's 512MB RAM limit.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# 2. Install remaining Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code, pre-seeded DB, and sample docs
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy root entrypoint
COPY run.py ./

EXPOSE 8000

CMD ["python", "run.py"]
