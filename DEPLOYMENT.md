# 🚀 Deploying PolicyLens RAG Assistant to Production

PolicyLens is configured as a single unified service: FastAPI serves both the RAG API endpoints and the built React frontend.

---

## ⚡ Quickest Option: Render.com (100% Free)

### Method A: Blueprint (Recommended - 2 Minutes)
1. Push this project to your GitHub account:
   ```bash
   # Create a new repository on github.com, then run:
   git remote add origin https://github.com/<your-username>/policylens-rag.git
   git branch -M main
   git push -u origin main
   ```
2. Log into [Render.com](https://dashboard.render.com).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository (`policylens-rag`).
5. Render detects `render.yaml` automatically.
6. Set the environment variable:
   - `GROQ_API_KEY`: Your Groq API key (`gsk_...`)
7. Click **Apply**. Render will build and launch your app with a permanent HTTPS link (e.g. `https://policylens-rag.onrender.com`).

---

### Method B: Manual Web Service on Render
1. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `python run.py`
4. In **Environment Variables**, add:
   - `GROQ_API_KEY` = your Groq API key
5. Click **Create Web Service**.

---

## 🚂 Option 2: Railway.app

1. Go to [Railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select your repository. Railway will detect the `Dockerfile` and `railway.toml`.
4. In the service **Variables** tab, add:
   - `GROQ_API_KEY` = your Groq API key
5. In **Settings** → **Networking**, click **Generate Domain**.
6. Your live public URL is ready!

---

## 🤗 Option 3: Hugging Face Spaces (Free Cloud Hosting)

1. Go to [Hugging Face Spaces](https://huggingface.co/spaces) and click **Create new Space**.
2. Name your space (e.g., `policylens-rag`).
3. Select **Docker** as the Space SDK (Blank template).
4. Set Space Hardware to **Free (2 vCPU · 16 GB RAM)**.
5. In your local terminal, add HF as a remote and push:
   ```bash
   git remote add hf https://huggingface.co/spaces/<your-username>/policylens-rag
   git push hf main
   ```
6. In **Settings** → **Variables and Secrets**, add a Secret:
   - `GROQ_API_KEY`: your Groq API key.
7. Your app is live instantly on `https://huggingface.co/spaces/<your-username>/policylens-rag`!

---

## 🌐 Option 4: Instant Public Access via Pinggy / ngrok (No Cloud Setup Needed)

If you want a shareable public link directly from your laptop right now:

### Using Pinggy (Zero installation):
```bash
ssh -p 443 -R0:localhost:8000 qr@a.pinggy.io
```
*(This immediately outputs a live `https://...pinggy.link` URL you can open from anywhere).*

### Using ngrok:
```bash
ngrok http 8000
```
