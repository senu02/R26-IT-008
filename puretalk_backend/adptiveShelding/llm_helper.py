"""
LLM Helper — Adaptive Emotional Shielding Module (AESM)
========================================================
Provides LLM-enhanced versions of the core text-processing strategies.

In production these functions call an external LLM (e.g. Google Gemini /
OpenAI GPT) to produce more natural rewrites and blurs.  When the LLM is
unavailable (no API key, network error, etc.) every function falls back
gracefully to the local rule-based helpers in engine.py.

[SL] LLM API calls fail wuna wita local helper functions use karanawa —
     system eka always work karanawa.

Architecture note
-----------------
The tests mock this module at ``adptiveShelding.engine.llm_helper.*`` so
the module **must** be imported into engine.py with:

    from . import llm_helper

and the engine must call  ``llm_helper.blur_toxic_words_with_llm(text)``
etc., so that the test patches land correctly.
"""

from __future__ import annotations

import logging
import os
import re

logger = logging.getLogger(__name__)

# ── Optional: load your LLM client here ──────────────────────────────────
# Example (Google Generative AI):
#   import google.generativeai as genai
#   genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))
#   _llm_model = genai.GenerativeModel("gemini-pro")
#
# Set to None to always use local fallbacks.
_llm_available = False  # flip to True once you wire in real API calls


# ── Local fallback imports (imported lazily to avoid circular refs) ───────
def _local_blur(text: str) -> str:
    from .engine import blur_text
    return blur_text(text)


def _local_rewrite(text: str) -> str:
    from .engine import rewrite_text
    return rewrite_text(text)


# ─────────────────────────────────────────────────────────────────────────
# Public API used by engine.py
# ─────────────────────────────────────────────────────────────────────────

def translate_to_english(text: str) -> str:
    """
    Translate / transliterate Singlish (Sinhala-English mixed) text to
    plain English so the English-trained ML model can score it more
    accurately.

    Currently uses only the local normalization map.  Swap the body for an
    LLM call when you have an API key.

    [SL] Singlish text English ekakata translate karannawa — ML model
         better score ganna.
    """
    if not _llm_available:
        # Fallback: just return as-is (normalization happens inside engine)
        return text

    # ── LLM path (example skeleton) ──────────────────────────────────
    try:
        prompt = (
            "Translate the following Sinhala-English mixed message to plain "
            f"English only, preserving the meaning:\n\n{text}"
        )
        # response = _llm_model.generate_content(prompt)
        # return response.text.strip()
        return text  # placeholder until LLM is wired
    except Exception as exc:
        logger.warning("translate_to_english LLM call failed: %s", exc)
        return text


def blur_toxic_words_with_llm(text: str) -> str:
    """
    Use an LLM to intelligently mask toxic words.  Falls back to the
    local word-replacement blur when the LLM is unavailable.

    [SL] LLM use karala toxic words mask karanawa.  LLM nattam local
         blur_text() use karanawa.
    """
    if not _llm_available:
        return _local_blur(text)

    try:
        prompt = (
            "Replace each toxic, offensive, or hate-speech word in the "
            "following message with '****'.  Leave all other words exactly "
            f"as they are:\n\n{text}"
        )
        # response = _llm_model.generate_content(prompt)
        # return response.text.strip()
        return _local_blur(text)  # placeholder until LLM is wired
    except Exception as exc:
        logger.warning("blur_toxic_words_with_llm LLM call failed: %s", exc)
        return _local_blur(text)


def rewrite_with_llm(text: str) -> str:
    """
    Use an LLM to rewrite a toxic or aggressive message in a calm,
    constructive tone.  Falls back to the local word-map rewrite.

    [SL] LLM use karala toxic message neutral tone ekakata rewrite
         karanawa.  LLM nattam local rewrite_text() use karanawa.
    """
    if not _llm_available:
        return _local_rewrite(text)

    try:
        prompt = (
            "Rewrite the following message to remove all offensive, toxic, "
            "or aggressive language.  Keep the core meaning but use a calm, "
            "respectful, and constructive tone.  Do NOT add any extra "
            f"explanation:\n\n{text}"
        )
        # response = _llm_model.generate_content(prompt)
        # rewritten = response.text.strip()
        # return rewritten + " 🙂 Let's keep it positive."
        return _local_rewrite(text)  # placeholder until LLM is wired
    except Exception as exc:
        logger.warning("rewrite_with_llm LLM call failed: %s", exc)
        return _local_rewrite(text)
