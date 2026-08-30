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

# pyrefly: ignore [missing-import]
from . import llm_helper  # LLM-enhanced helpers (mocked in unit tests)

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
# Singlish insult word list (module-level)
# ─────────────────────────────────────────────
# [EN] All Singlish insult / slur words.  Used by:
#   1. _normalize()  — maps to English so the ML model can score them.
#   2. aesm_engine() — needs_rewrite check: ANY word here forces Rewriting
#      even when the ML score is low (the English model under-scores Singlish).
# [SL] Singlish insult words list.  _normalize() eka English ekakata
#      map karanawa ML scoring walata.  needs_rewrite check eke direct
#      use wenawa — ML score adhu wunath Rewriting trigger wenawa.
_SINGLISH_INSULTS: frozenset = frozenset({
    # -- Direct insults / slurs ------------------------------------------
    "huththo",   # bastard
    "huththa",   # bastard
    "huthto",    # bastard
    "hutta",     # bastard
    "hutto",     # bastard
    "pakaya",    # idiot
    "pakayo",    # idiots
    "pakku",     # idiots
    "pako",      # idiot
    "ponnaya",   # idiot (offensive)
    "ponnayo",   # idiots
    "ponnayek",  # idiot
    "balla",     # dog (derogatory)
    "ballo",     # dogs
    "balli",     # dog
    "modaya",    # idiot
    "moda",      # stupid
    "wesige",    # whore's (highly offensive)
    "wesiyek",   # whore
    "wesi",      # offensive slur
    "kari",      # offensive slur
    "kariyo",    # offensive (plural)
    "pissu",     # crazy / derogatory
    "puka",      # obscene
    "yako",      # devil / offensive
    "yakka",     # devil / offensive
    "gon",       # idiot / stupid
    "gonwa",     # idiot
    "palayan",   # get lost (rude)
    "palyan",    # get lost (variant spelling)
    "hora",      # thief (derogatory)
    "durjanaya", # wicked person
    "narakaya",  # evil person
    "naraka",    # evil / bad
    # -- Singlish violent/threatening actions ----------------------------
    "maranawa",  # to kill
    "gahanawa",  # to hit / beat
})

# Full Singlish normalization map (insults + pronouns + actions).
# Used ONLY by _normalize() for ML pre-processing.
# [SL] ML scoring walata vitarak — rewriting/blurring walata _REPLACEMENTS
#      saha _SINGLISH_INSULTS use karanawa.
_SINGLISH_NORMALIZE_MAP: dict = {
    # Insults / slurs  (longer entries first to avoid partial matches)
    "huththo":   "bastard",
    "huththa":   "bastard",
    "huthto":    "bastard",
    "hutta":     "bastard",
    "hutto":     "bastard",
    "pakaya":    "idiot",
    "pakayo":    "idiots",
    "pakku":     "idiots",
    "ponnaya":   "idiot",
    "ponnayo":   "idiots",
    "ponnayek":  "idiot",
    "modaya":    "idiot",
    "wesige":    "whore's",
    "wesiyek":   "whore",
    "kariyo":    "bad people",
    "durjanaya": "bad person",
    "narakaya":  "bad person",
    "maranawa":  "kill",
    "gahanawa":  "hit",
    "gonwa":     "stupid person",
    "palayan":   "go away",
    "palyan":    "go away",
    "yakka":     "evil",
    "pako":      "idiot",
    "balla":     "dog",
    "ballo":     "dogs",
    "balli":     "dog",
    "moda":      "stupid",
    "pissu":     "crazy",
    "naraka":    "bad",
    "wesi":      "bad",
    "kari":      "bad",
    "hora":      "thief",
    "puka":      "obscene",
    "yako":      "evil",
    "gon":       "stupid",
    # Pronouns / common neutral words
    "oya":       "you",
    "mama":      "i",
    "api":       "we",
    "eyaa":      "she",
    "eya":       "he",
    "ohu":       "he",
    "oha":       "she",
    "meka":      "this",
    "eka":       "it",
    "ara":       "that",
    # Neutral actions
    "denna":     "give",
    "yanawa":    "go",
    "enawa":     "come",
    "karanna":   "do",
    # Common phrases
    "honda na":  "bad",
    "nikan":     "just",
}


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
    # Use module-level map — longer entries first to avoid partial matches
    for singlish, english in _SINGLISH_NORMALIZE_MAP.items():
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
    "hate":    "dislike",
    "idiot":   "person",
    "stupid":  "not very smart",
    "ugly":    "not very attractive",
    "dumb":    "less informed",
    "kill":    "concern about",
    "fuck":    "mess",
    "fucking": "",            # deleted — "you are a very person" is broken
    "shit":    "rubbish",
    "bitch":   "person",
    "useless": "not very helpful",
    "worst":   "least impressive",
    "asshole": "person",
    "motherfucker": "person",
    "cunt":    "person",
    "slut":    "person",
    "whore":   "person",
    "bastard": "person",
    "dick":    "unkind",
    "pussy":   "hesitant",
    
    # ── Singlish insults → neutral English replacements ───────────────
    # [EN] Every word in _SINGLISH_INSULTS must have an entry here so
    #      rewrite_text() and blur_text() can neutralise it.
    #      Neutral replacements are chosen to preserve sentence flow.
    # [SL] _SINGLISH_INSULTS eke hama word ekakata neutral replacement
    #      thiyanawa — rewrite_text() saha blur_text() walata.

    # Huththo / huthto family  →  friend
    "huththo":   "friend",
    "huththa":   "friend",
    "huthto":    "friend",
    "hutta":     "friend",
    "hutto":     "friend",

    # Pakaya / ponnaya / modaya family  →  person / friend
    "pakaya":    "person",
    "pakayo":    "friends",
    "pakku":     "friends",
    "pako":      "friend",
    "ponnaya":   "person",
    "ponnayo":   "people",
    "ponnayek":  "person",
    "modaya":    "silly person",
    "moda":      "silly",

    # Balla family  →  person
    "balla":     "person",
    "ballo":     "people",
    "balli":     "person",

    # Wesi family  →  person / person's
    "wesi":      "person",
    "wesige":    "person's",
    "wesiyek":   "person",

    # Kari family  →  not the best  (was "bad" which is too close to original)
    "kari":      "not the best",
    "kariyo":    "not great people",

    # Pissu / gon  →  silly / less thoughtful
    "pissu":     "silly",
    "gon":       "less thoughtful",
    "gonwa":     "less thoughtful person",

    # Puka  →  lower back  (anatomical, defused)
    "puka":      "lower back",

    # Violence / threats  →  concern for / talk to
    "maranawa":  "talk to",
    "gahanawa":  "talk to",

    # Get-lost variants  →  please step back
    "palayan":   "please step back",
    "palyan":    "please step back",

    # Devil / evil variants  →  person
    "yako":      "person",
    "yakka":     "person",

    # Thief / wicked  →  person who made a mistake
    "hora":      "person who made a mistake",
    "durjanaya": "person",
    "narakaya":  "person",
    "naraka":    "not good",

    # Neutral filler (kept for sentence-flow rewriting)
    "nikan":     "just",
}


def blur_text(text: str) -> str:
    """
    Replace known toxic words with ****.  Punctuation attached to a word
    is stripped before the lookup so e.g. "hate!" still matches "hate",
    but non-toxic words are always preserved unchanged.

    [EN] Only toxic words are replaced — all other words pass through.
    [SL] Toxic words vitarak **** vennawa — other words unchanged.
    """
    toxic_keys = set(_REPLACEMENTS.keys())
    words = text.split()
    result = []
    for w in words:
        core = re.sub(r"[^a-zA-Z]", "", w).lower()
        if core in toxic_keys:
            result.append("****")
        else:
            result.append(w)
    return " ".join(result)


def rewrite_text(text: str) -> str:
    """
    Replace toxic words with neutral alternatives.

    Words mapped to "" in _REPLACEMENTS are deleted entirely.
    Double-spaces left by deletions are collapsed to a single space.
    A positive suffix is appended at the end.
    """
    def replace_word(match):
        word = match.group(0)
        lw = word.lower()
        if lw in _REPLACEMENTS:
            replacement = _REPLACEMENTS[lw]
            if replacement == "":
                return ""   # delete the word
            # Preserve capitalization
            if word.isupper():
                return replacement.upper()
            elif word.istitle():
                return replacement.title()
            return replacement
        return word

    rewritten = re.sub(r'[a-zA-Z]+', replace_word, text)
    # Collapse multiple spaces (e.g. when a word was deleted)
    rewritten = re.sub(r'  +', ' ', rewritten).strip()
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

    # [EN] needs_rewrite is True when ANY known toxic word is found.
    #      We check BOTH _REPLACEMENTS (English + Singlish rewrite targets)
    #      AND _SINGLISH_INSULTS (the raw Singlish insult set) so that a
    #      Singlish insult word always triggers Rewriting — even if the
    #      English-trained ML model gives it a low score.
    # [SL] needs_rewrite — English toxic words (via _REPLACEMENTS) saha
    #      Singlish insult words (via _SINGLISH_INSULTS) hondatama check
    #      karanawa.  ML score adhu wunath Singlish insult ekak thiyanawa
    #      nam Rewriting strategy auto-trigger wenawa.
    _all_toxic = _REPLACEMENTS.keys() | _SINGLISH_INSULTS
    needs_rewrite = any(
        re.search(r'\b' + re.escape(w) + r'\b', lw_text)
        for w in _all_toxic
    )

    # ── Strategy selection ────────────────────────────────────────────
    # [EN] Priority order:
    #
    #   1. REWRITING  — needs_rewrite is True (message has known toxic
    #      words that we can replace with neutral alternatives).
    #      Checked FIRST so we ALWAYS rewrite fixable content regardless
    #      of how high the score is.  Blocking content we can fix defeats
    #      the purpose of the Rewriting intervention.
    #
    #   2. FILTERING  — final_score >= FILTER_T AND we cannot rewrite
    #      (no known toxic words found).  Unknown / unrecognisable harm
    #      that our word-map cannot neutralise → hide the message.
    #
    #   3. BLURRING   — final_score >= BLUR_T (offensive but not extreme).
    #
    #   4. WARNING    — final_score >= WARNING_T (borderline).
    #
    #   5. SAFE       — everything else.
    #
    # [SL] Priority order:
    #   1. REWRITING  — needs_rewrite = True (known toxic words thiyanawa,
    #      replace karanna puluwan).  Score kiyadha balanawa nehe — hama
    #      widihata rewrite karanawa.
    #   2. FILTERING  — needs_rewrite = False (unknown harm) + very high score.
    #   3. BLURRING   — final_score >= BLUR_T.
    #   4. WARNING    — final_score >= WARNING_T.
    #   5. SAFE       — other.

    # ── 1. REWRITING (always first when we can fix the content) ───────
    # [EN] If the message contains ANY known toxic word (English or
    #      Singlish) we can substitute with a neutral alternative, rewrite
    #      it — even if the ML score is very high or the user has a bad
    #      behavior history.  "Fix it, don't just hide it."
    # [SL] Known toxic word ekak thiyanawa nam — ML score kiyadha, behavior
    #      score kiyadha balanawa nehe — hama widihata rewrite karanawa.
    #      "Hadanawa, block karanawa nehe."
    if needs_rewrite:
        translated = llm_helper.translate_to_english(text)
        rewritten  = llm_helper.rewrite_with_llm(translated)
        return {
            "strategy":     "Rewriting",
            "output":       rewritten,
            "new_toxicity": round(get_toxicity(rewritten), 4),
            "support":      emotional_support(),
            "toxicity":     round(toxicity, 4),
            "behavior":     round(behavior, 4),
            "final_score":  round(final_score, 4),
        }

    # ── 2. FILTERING (only when we CANNOT rewrite the content) ────────
    # [EN] Highest harm AND no known replaceable words — hide the message.
    #      This fires for completely unknown hate-speech / threats that our
    #      word-map cannot neutralise.
    # [SL] Wada harm + replace karanna bari (unknown words) — message
    #      hide karanawa.
    elif final_score >= FILTER_T:
        return {
            "strategy":    "Filtering",
            "output":      "Message hidden due to high toxicity.",
            "support":     emotional_support(),
            "toxicity":    round(toxicity, 4),
            "behavior":    round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # ── 3. BLURRING ────────────────────────────────────────────────────
    # [EN] Offensive words masked (e.g. f***). Message still delivered.
    # [SL] Offensive words mask karanawa. Message deliver wenawa.
    elif final_score >= BLUR_T:
        translated = llm_helper.translate_to_english(text)
        blurred    = llm_helper.blur_toxic_words_with_llm(translated)
        return {
            "strategy":    "Blurring",
            "output":      blurred,
            "support":     emotional_support(),
            "toxicity":    round(toxicity, 4),
            "behavior":    round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # ── 4. WARNING ─────────────────────────────────────────────────────
    # [EN] Borderline. Message passes through; user shown a caution notice.
    # [SL] Borderline. Message pass, bat user lata warn karanawa.
    elif final_score >= WARNING_T:
        return {
            "strategy":    "Warning",
            "output":      text,
            "highlighted": highlight_toxic_words(text),
            "warning":     "⚠️ Warning: This message may contain potentially harmful content.",
            "support":     emotional_support(),
            "toxicity":    round(toxicity, 4),
            "behavior":    round(behavior, 4),
            "final_score": round(final_score, 4),
        }

    # ── 5. SAFE ────────────────────────────────────────────────────────
    # [EN] Clean content. No shielding applied. Passes through unchanged.
    # [SL] Clean content. Shielding nehe. Unchanged pass wenawa.
    else:
        return {
            "strategy":    "Safe",
            "output":      text,
            "support":     "",
            "toxicity":    round(toxicity, 4),
            "behavior":    round(behavior, 4),
            "final_score": round(final_score, 4),
        }