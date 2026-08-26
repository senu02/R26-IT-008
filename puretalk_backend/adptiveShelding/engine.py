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
# Paths — models live in <project_root>/model/adptiveShelding/
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))         # adptiveShelding/
PROJECT_ROOT = os.path.dirname(BASE_DIR)                       # puretalk_backend/
MODEL_PATH = os.path.join(PROJECT_ROOT, "model", "adptiveShelding", "toxicity_model.h5")
VECTORIZER_PATH = os.path.join(PROJECT_ROOT, "model", "adptiveShelding", "vectorizer.pkl")

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
    """
    Normalize text before ML scoring.
    Maps common Singlish words to their English equivalents so the
    English-trained ML model can still detect toxicity.

    [EN] Maps Singlish slang to English before scoring.
    [SL] Singlish words English ekakata convert karannawa, ML model
         eka correctly detect karanna.
    """
    text = text.lower()
    # Singlish word-for-word normalization (order matters - longer first)
    singlish_map = {
        # Insults / slurs
        "huththo":    "bastard",
        "huththa":    "bastard",
        "huthto":     "bastard",
        "hutta":      "bastard",
        "hutto":      "bastard",
        "pakaya":     "idiot",
        "pakayo":     "idiots",
        "pakku":      "idiots",
        "pako":       "idiot",
        "ponnaya":    "idiot",
        "ponnayo":    "idiots",
        "ponnayek":   "idiot",
        "balla":      "dog",
        "ballo":      "dogs",
        "balli":      "dog",
        "modaya":     "idiot",
        "moda":       "stupid",
        "wesige":     "whore's",
        "wesiyek":    "whore",
        "wesi":       "bad",
        "kari":       "bad",
        "kariyo":     "bad people",
        "pissu":      "crazy",
        # Pronouns / common words
        "oya":        "you",
        "mama":       "i",
        "api":        "we",
        "eya":        "he",
        "eyaa":       "she",
        "ohu":        "he",
        "oha":        "she",
        "eka":        "it",
        "meka":       "this",
        "ara":        "that",
        # Actions
        "maranawa":   "kill",
        "gahanawa":   "hit",
        "denna":      "give",
        "yanawa":     "go",
        "enawa":      "come",
        "karanna":    "do",
        # Common negative phrases
        "honda na":   "bad",
        "nikan":      "just",
    }
    for singlish, english in singlish_map.items():
        text = re.sub(r'\b' + re.escape(singlish) + r'\b', english, text)
    # Strip non-alphanumeric after mapping
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text


def get_toxicity(text: str) -> float:
    """Return a toxicity score in [0, 1] for the given text."""
    _load_artifacts()
    cleaned = _normalize(text)
    vectorized = _vectorizer([cleaned])
    prediction = _model.predict(vectorized, verbose=0)[0]
    score = float(max(prediction))          # max over 6 toxicity labels
    
    # Force a minimum toxicity score if known toxic words are present,
    # ensuring that final_score reaches at least 0.30 (Rewriting threshold)
    lw_text = text.lower()
    toxic_word_count = sum(
        1 for word in _REPLACEMENTS.keys()
        if re.search(r'\b' + re.escape(word) + r'\b', lw_text)
    )
    if toxic_word_count >= 4:
        score = max(score, 0.92)
    elif toxic_word_count >= 3:
        score = max(score, 0.78)
    elif toxic_word_count >= 2:
        score = max(score, 0.62)
    elif toxic_word_count >= 1 and score < 0.5:
        score = 0.5
            
    return score


def get_behavior_score(user_history: list) -> float:
    """Average toxicity score from the user's recent message history."""
    if not user_history:
        return 0.0
    return sum(user_history) / len(user_history)


# ─────────────────────────────────────────────
# Strategy helpers
# ─────────────────────────────────────────────
_REPLACEMENTS = {
    # English
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
    "asshole": "person",
    "motherfucker": "person",
    "cunt": "person",
    "slut": "person",
    "whore": "person",
    "bastard": "person",
    "dick": "jerk",
    "pussy": "coward",
    
    # ── Singlish insults (rewrite target → neutral replacement) ──────
    # [EN] These Singlish toxic words are replaced with neutral English
    #      equivalents in the rewrite_text() and blur_text() functions.
    # [SL] Meka Singlish toxic words neutral English ekakata replace karanawa.
    "pako":      "friend",
    "huththo":   "friend",
    "huththa":   "friend",
    "huthto":    "friend",
    "hutta":     "friend",
    "hutto":     "friend",
    "kari":      "bad",
    "kariyo":    "bad people",
    "ponnaya":   "person",
    "ponnayo":   "people",
    "ponnayek":  "person",
    "balla":     "person",
    "ballo":     "people",
    "balli":     "person",
    "wesi":      "person",
    "wesige":    "person's",
    "wesiyek":   "person",
    "puka":      "back",
    "pakaya":    "person",
    "pakayo":    "friends",
    "pakku":     "friends",
    "pissu":     "funny",
    "moda":      "silly",
    "modaya":    "silly person",
    "maranawa":  "hurt",
    "gahanawa":  "hit",
    "nikan":     "just",
    # Additional Singlish insult variants
    "palayan":   "go away",
    "yako":      "person",
    "yakka":     "person",
    "gon":       "stupid",
    "gonwa":     "stupid person",
    "hora":      "thief",
    "durjanaya": "bad person",
    "narakaya":  "bad person",
    "naraka":    "bad",
}


def blur_text(text: str) -> str:
    toxic_keys = set(_REPLACEMENTS.keys())
    words = text.split()
    result = []
    for w in words:
        core = re.sub(r"[^a-zA-Z]", "", w).lower()
        if core in toxic_keys or len(w) > 4:
            result.append("****")
        else:
            result.append(w)
    return " ".join(result)


def rewrite_text(text: str) -> str:
    # Use regex to find words (ignoring punctuation attached to them)
    def replace_word(match):
        word = match.group(0)
        lw = word.lower()
        if lw in _REPLACEMENTS:
            replacement = _REPLACEMENTS[lw]
            # Try to preserve capitalization
            if word.isupper():
                return replacement.upper()
            elif word.istitle():
                return replacement.title()
            return replacement
        return word

    rewritten = re.sub(r'[a-zA-Z]+', replace_word, text)
    return rewritten + " 🙂 Let's keep it positive."


def highlight_toxic_words(text: str) -> str:
    toxic_keys = set(_REPLACEMENTS.keys())
    words = text.split()
    result = []
    for w in words:
        core = re.sub(r"[^a-zA-Z]", "", w).lower()
        if core in toxic_keys:
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
def aesm_engine(text: str, user_history: list = None, language: str = "english") -> dict:
    """
    Run the Adaptive Emotional Shielding engine.

    Args:
        text:         The incoming message text.
        user_history: List of previous toxicity scores for this user.
        language:     'english' (default) or 'singlish'.
                      When 'singlish', thresholds are lowered by 0.10 so
                      Singlish toxic words that score slightly below the
                      English threshold still trigger the correct strategy.

    [SL] language='singlish' nam thresholds 0.10 adhu karanawa.
         Singlish toxic words ML model eke score adhu wenna puluwan
         (English model nisat), bat threshold adhu kala epa miss wenna.

    Returns:
        dict with keys:
            strategy     – one of: Filtering, Blurring, Warning, Rewriting, Safe
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

    # ── Language-aware threshold adjustment ──────────────────────────
    # [EN] The ML model was trained on English text. Singlish toxic words
    #      often score 0.10-0.20 lower than their English equivalents because
    #      the model hasn't seen them during training. Lowering thresholds
    #      by 0.10 compensates for this systematic under-scoring.
    # [SL] ML model English text walata train una. Singlish toxic words
    #      English equivalents walata vada 0.10-0.20 adhu score karanawa.
    #      Thresholds 0.10 adhu karala eka compensate karanawa.
    threshold_offset = -0.10 if language == "singlish" else 0.0
    FILTER_T  = 0.85 + threshold_offset   # e.g. 0.75 for Singlish
    BLUR_T    = 0.65 + threshold_offset   # e.g. 0.55 for Singlish
    WARNING_T = 0.45 + threshold_offset   # e.g. 0.35 for Singlish
    REWRITE_T = 0.30 + threshold_offset   # e.g. 0.20 for Singlish

    lw_text = text.lower()
    needs_rewrite = any(
        re.search(r'\b' + re.escape(w) + r'\b', lw_text)
        for w in _REPLACEMENTS.keys()
    )

    # ── Strategy selection (language-aware thresholds) ────────────────
    # [EN] Each strategy maps to one of the 5 AESM interventions.
    #      Thresholds shift down for Singlish to catch under-scored words.
    # [SL] Hama strategy eka AESM eke 5 interventions ekakata map wenawa.
    #      Singlish walata thresholds adhu shift wenawa.

    # -- Filtering (Message Filtering / Hide) --------------------------
    # [EN] Highest harm. Message completely hidden from the recipient.
    # [SL] Wada harm. Message puraya hide wenawa.
    if final_score >= FILTER_T:
        return {
            "strategy": "Filtering",
            "output": "Message hidden due to high toxicity.",
            "support": emotional_support(),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # -- Blurring (Content Blurring) -----------------------------------
    # [EN] Offensive words masked (e.g. f***). Message still delivered.
    # [SL] Offensive words mask karanawa (e.g. f***). Message deliver wenawa.
    elif final_score >= BLUR_T:
        return {
            "strategy": "Blurring",
            "output": blur_text(text),
            "support": emotional_support(),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # -- Warning (Warning Notification) --------------------------------
    # [EN] Borderline content. Message allowed but toxic words highlighted.
    # [SL] Borderline content. Message pass, bat toxic words highlight.
    elif final_score >= WARNING_T:
        return {
            "strategy": "Warning",
            "output": f"{highlight_toxic_words(text)}",
            "support": emotional_support(),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # -- Rewriting (Tone Rewriting) ------------------------------------
    # [EN] Aggressive tone rewritten to neutral language by word-map.
    #      Also triggers if any known toxic word is present (needs_rewrite).
    # [SL] Aggressive tone neutral ekakata rewrite wenawa.
    #      Known toxic word ekak thiyanawa nam always trigger wenawa.
    elif final_score >= REWRITE_T or needs_rewrite:
        rewritten = rewrite_text(text)
        return {
            "strategy": "Rewriting",
            "output": rewritten,
            "new_toxicity": round(get_toxicity(rewritten), 4),
            "support": emotional_support(),
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # -- Safe (No Intervention) ----------------------------------------
    # [EN] Clean content. No shielding applied. Passes through unchanged.
    # [SL] Clean content. Shielding nehe. Unchanged pass wenawa.
    else:
        return {
            "strategy": "Safe",
            "output": text,
            "toxicity": round(toxicity, 4),
            "behavior": round(behavior, 4),
            "final_score": round(final_score, 4),
        }