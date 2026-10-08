"""
LLM Helper — Adaptive Emotional Shielding Module (AESM)
========================================================
Provides LLM-enhanced versions of the core text-processing strategies
using Google Gemini API (or falling back gracefully to local processing).
"""

from __future__ import annotations

import logging
import os
import json
import urllib.request

logger = logging.getLogger(__name__)


def _local_blur(text: str) -> str:
    # pyrefly: ignore [missing-import]
    from .engine import blur_text
    return blur_text(text)


def _local_rewrite(text: str) -> str:
    # pyrefly: ignore [missing-import]
    from .engine import rewrite_text
    return rewrite_text(text)


def _call_gemini_api(prompt: str) -> str | None:
    """
    Call Google Gemini API via REST.
    Returns generated text if GEMINI_API_KEY is present and request succeeds,
    otherwise returns None to trigger local fallback.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None

    # Try supported Gemini models in order
    models_to_try = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"]
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    for model_name in models_to_try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode("utf-8"))
                candidates = result.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception as exc:
            logger.warning("Google Gemini API call failed for model %s: %s", model_name, exc)

    return None


def translate_to_english(text: str) -> str:
    """
    Translate / transliterate Singlish (Sinhala-English mixed) text to
    plain English so the ML model can score it more accurately.
    """
    prompt = (
        "Translate the following Singlish / Sinhala-English mixed message to plain "
        f"English only, preserving the exact emotion and meaning:\n\n{text}"
    )
    llm_res = _call_gemini_api(prompt)
    if llm_res:
        return llm_res

    return text


def blur_toxic_words_with_llm(text: str) -> str:
    """
    Use Google Gemini LLM to mask toxic words. Falls back to local blur_text().
    """
    prompt = (
        "Replace each toxic, offensive, or hate-speech word in the "
        "following message with '****'. Leave all other words exactly "
        f"as they are:\n\n{text}"
    )
    llm_res = _call_gemini_api(prompt)
    if llm_res:
        return llm_res

    return _local_blur(text)


def rewrite_with_llm(text: str) -> str:
    """
    Use Google Gemini LLM to rewrite a toxic message in a calm, neutral tone.
    Falls back gracefully to local rewrite_text().
    """
    prompt = (
        "Rewrite the following message to remove all offensive, toxic, "
        "or aggressive language. Keep the core meaning but use a calm, "
        "respectful, and constructive tone. Do NOT add meta commentary:\n\n{text}"
    )
    llm_res = _call_gemini_api(prompt)
    if llm_res:
        return llm_res + " 🙂 Let's keep it positive."

    return _local_rewrite(text)
