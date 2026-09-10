"""
Groq LLM integration for answer generation.
Uses llama-3.1-8b-instant with a strict RAG prompt that forces
the model to cite only the provided context.
"""
import os
import httpx
from groq import Groq
from typing import List
from dotenv import load_dotenv

load_dotenv()

_client: Groq | None = None


def get_groq_client() -> Groq:
    """
    Build a Groq client with an explicit httpx.Client to avoid any
    'proxies' keyword argument mismatch between groq and httpx.
    """
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY environment variable is not set. "
                "Please add it to backend/.env"
            )
        # Explicit client with trust_env=False avoids any proxy kwargs mismatch
        http_client = httpx.Client(trust_env=False)
        _client = Groq(api_key=api_key, http_client=http_client)
    return _client


RAG_SYSTEM_PROMPT = """You are an enterprise document assistant. Your ONLY job is to answer questions using the provided context excerpts from company documents.

STRICT RULES:
1. Answer ONLY using information explicitly present in the provided context.
2. If the answer is not in the context, respond with: "I could not find information about this in the available documents. Please consult your HR representative or IT support."
3. Always cite your sources using the format: [Source: <document_name>, Section: <section_title>]
4. Be concise and professional. Use bullet points for multi-part answers.
5. Do NOT make up information, extrapolate, or use external knowledge.
6. Quote relevant passages when helpful."""

RAG_USER_TEMPLATE = """Context from company documents:
{context}

---
Question: {question}

Please answer the question using only the context above. Cite your sources."""


def build_context_string(chunks: List[dict]) -> str:
    """Format retrieved chunks into a numbered context block."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] Document: {chunk['document_name']}\n"
            f"    Section: {chunk['section_title']}\n"
            f"    Content: {chunk['text']}"
        )
    return "\n\n".join(parts)


def generate_answer(question: str, context_chunks: List[dict], target_language: str = "English") -> str:
    """
    Call Groq LLM to generate a grounded answer from context chunks.
    If target_language is provided and not English, answers directly in that language
    while maintaining strict grounding in the English policy documents.
    Tries configured or standard models with automatic fallback.
    """
    client = get_groq_client()

    context_str = build_context_string(context_chunks)

    lang_instruction = ""
    if target_language and target_language.strip().lower() not in ("english", "en"):
        lang_instruction = (
            f"\n\nCRITICAL LANGUAGE REQUIREMENT:\nYou MUST provide your entire answer in {target_language}. "
            f"Accurately translate technical and policy terms into natural {target_language} while keeping citations clear."
        )

    user_message = RAG_USER_TEMPLATE.format(
        context=context_str,
        question=question
    ) + lang_instruction

    preferred_model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
    models_to_try = [
        preferred_model,
        "qwen/qwen3.8-27b",
        "groq/compound-mini",
        "openai/gpt-oss-20b"
    ]
    # Deduplicate while preserving order
    seen = set()
    candidate_models = [m for m in models_to_try if not (m in seen or seen.add(m))]

    last_err = None
    for model_name in candidate_models:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": RAG_SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                temperature=0.1,        # Low temperature for factual, grounded answers
                max_tokens=1024,
                top_p=0.9,
            )
            return response.choices[0].message.content.strip()
        except Exception as err:
            last_err = err
            continue

    raise RuntimeError(f"All Groq models failed. Last error: {last_err}")


