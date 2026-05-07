"""
Adaptive Emotional Shielding Module (AESM) Engine
Loads the trained toxicity model + vectorizer and runs predictions.
"""

import os
import re
import pickle
import numpy as np

import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import TextVectorization

# ─────────────────────────────────────────────
# Paths — pointing to the correct trained models
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "model", "toxicity_detection", "toxicity_model.h5")
VECTORIZER_PATH = os.path.join(BASE_DIR, "model", "toxicity_detection", "vectorizer.pkl")

# ─────────────────────────────────────────────
# Load model + vectorizer once at startup
# ─────────────────────────────────────────────
_model = None
_vectorizer = None


def _load_artifacts():
    global _model, _vectorizer

    if _model is None:
        _model = load_model(MODEL_PATH)

    if _vectorizer is None:
        with open(VECTORIZER_PATH, "rb") as f:
            data = pickle.load(f)

        # Restore vectorizer from saved config + vocab
        config = data["config"]
        config["max_tokens"] = 30000          # keep memory safe
        _vectorizer = TextVectorization.from_config(config)
        _vectorizer.set_vocabulary(data["vocab"][:30000])


# ─────────────────────────────────────────────
# Helper utilities
# ─────────────────────────────────────────────
def _normalize(text: str) -> str:
    text = text.lower()
    # Singlish / slang normalization
    text = text.replace("oya", "you")
    text = text.replace("pissu", "crazy")
    text = text.replace("wesi", "bad")
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text


def get_toxicity(text: str) -> float:
    """Return a toxicity score in [0, 1] for the given text."""
    _load_artifacts()
    cleaned = _normalize(text)
    vectorized = _vectorizer([cleaned])
    prediction = _model.predict(vectorized, verbose=0)[0]
    return float(max(prediction))          # max over 6 toxicity labels


def get_behavior_score(user_history: list) -> float:
    """Average toxicity score from the user's recent message history."""
    if not user_history:
        return 0.0
    return sum(user_history) / len(user_history)


# ─────────────────────────────────────────────
# Strategy helpers
# ─────────────────────────────────────────────
_REPLACEMENTS = {
    "hate": "dislike",
    "idiot": "person",
    "stupid": "not very smart",
    "ugly": "not attractive",
    "dumb": "less informed",
    "kill": "hurt",
    "fuck": "mess",
    "fucking": "very",
    "shit": "bad",
    "bitch": "person",
    "bad": "needs improvement",
    "useless": "not very helpful",
    "worst": "not the best experience",
}


def blur_text(text: str) -> str:
    words = text.split()
    return " ".join(["****" if len(w) > 4 else w for w in words])


def rewrite_text(text: str) -> str:
    words = text.split()
    new_words = []
    for w in words:
        lw = w.lower()
        new_words.append(_REPLACEMENTS.get(lw, w))
    return " ".join(new_words) + " 🙂 Let's keep it positive."


def highlight_toxic_words(text: str) -> str:
    toxic_keys = set(_REPLACEMENTS.keys())
    words = text.split()
    result = []
    for w in words:
        if w.lower() in toxic_keys:
            result.append(f"**{w}**")
        else:
            result.append(w)
    return " ".join(result)


def emotional_support() -> str:
    return (
        "💙 This message may be hurtful. "
        "Stay positive and consider taking a break or talking to someone you trust."
    )


# ─────────────────────────────────────────────
# Main AESM Engine
# ─────────────────────────────────────────────
def aesm_engine(text: str, user_history: list = None) -> dict:
    """
    Run the Adaptive Emotional Shielding engine.

    Args:
        text:         The incoming message text.
        user_history: List of previous toxicity scores for this user.

    Returns:
        dict with keys:
            strategy     – one of: Filtering, Blurring, Warning, Rewriting,
                           Emotional Support, Safe
            output       – the processed / final message string
            toxicity     – raw model score
            behavior     – behavioral score
            final_score  – weighted final score
    """
    if user_history is None:
        user_history = []

    toxicity = get_toxicity(text)
    behavior = get_behavior_score(user_history)
    final_score = (toxicity * 0.7) + (behavior * 0.3)

    if final_score >= 0.85:
        return {
            "strategy": "Filtering",
            "output": "🚫 Message hidden due to high toxicity",
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    elif final_score >= 0.65:
        return {
            "strategy": "Blurring",
            "output": blur_text(text),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    elif final_score >= 0.45:
        return {
            "strategy": "Warning",
            "output": f"⚠️ {highlight_toxic_words(text)}",
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    elif final_score >= 0.30:
        rewritten = rewrite_text(text)
        return {
            "strategy": "Rewriting",
            "output": rewritten,
            "new_toxicity": round(get_toxicity(rewritten), 4),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    else:
        return {
            "strategy": "Safe",
            "output": text,
            "support": emotional_support(),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }
