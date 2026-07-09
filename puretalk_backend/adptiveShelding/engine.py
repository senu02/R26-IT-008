"""
============================================================
Adaptive Emotional Shielding Module (AESM) — Engine
============================================================

Meka PureTalk platform eke core shielding engine.
Trained toxicity ML model saha vectorizer load karala
real-time predictions run karala message ekata correct strategy eka select
karala processed result eka return karala denawa.

Strategy pipeline (final_score ekata anuwawa):
    >= 0.85  ->  Filtering  | message eka block karala denawa — too toxic
    >= 0.65  ->  Blurring   | toxic words **** walen censor karala denawa
    >= 0.30  ->  Rewriting  | gentle alternatives walen rewrite karala denawa
     < 0.30  ->  Safe       | message pass karala, support note ekak attach karala denawa
"""

import os
import re
import pickle
import numpy as np

import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import TextVectorization


# ─────────────────────────────────────────────────────────────
# File Paths — Model saha Vectorizer files koheda thiyanawada
# Folder structure: puretalk_backend/model/adptiveShelding/
# ─────────────────────────────────────────────────────────────

# __file__ ekata relative wa current folder eka (adptiveShelding/) gannawa
BASE_DIR     = os.path.dirname(os.path.abspath(__file__))   # adptiveShelding/
PROJECT_ROOT = os.path.dirname(BASE_DIR)                     # puretalk_backend/

# Trained model (.h5) saha vectorizer (.pkl) eke full file paths
MODEL_PATH      = os.path.join(PROJECT_ROOT, "model", "adptiveShelding", "toxicity_model.h5")
VECTORIZER_PATH = os.path.join(PROJECT_ROOT, "model", "adptiveShelding", "vectorizer.pkl")

# Memory overflow wenna epa kiyala vocabulary size eka 30,000 walatat cap karala denawa
MAX_VOCAB = 30_000


# Singlish / local slang -> English mappings.
# _normalize() function eka meka use karala ML scoring issella text eka pre-process karala denawa.
#
# Reason: Model eka English corpus ekata train wela thiyenawa, so 'pissu' wage singlish
# words directly dunna nam model eka recognize karanna bari wela miss wela yanawa.
# Ehemai singlish words English walen replace karala denawa issella model ekata denawa.
_SINGLISH_MAP: dict[str, str] = {
    # ── Neutral address / pronoun terms ──
    "oya":       "you",      # 'oya'     = you (informal)
    "oyata":     "you",      # 'oyata'   = to you
    "umba":      "you",      # 'umba'    = you (rude/aggressive form)
    "umbata":    "you",      # 'umbata'  = to you (rude form)
    "uba":       "you",      # 'uba'     = you (very rude)
    "api":       "we",       # 'api'     = we / us
    "mama":      "i",        # 'mama'    = I / me (informal)
    "machan":    "bro",      # 'machan'  = bro / friend (neutral)
    "malli":     "bro",      # 'malli'   = younger brother / bro
    "nangi":     "sister",   # 'nangi'   = younger sister (neutral)
    "aiya":      "brother",  # 'aiya'    = older brother (neutral)
    "yako":      "dude",     # 'yako'    = dude / man (casual)
    "mokada":    "what",     # 'mokada'  = what / what's up
    "kohomath":  "anyway",   # 'kohomath'= anyway / regardless
    "nethnam":   "if not",   # 'nethnam' = if not / otherwise

    # ── Insults / Offensive slang ──
    "pissu":     "crazy",    # 'pissu'   = crazy (common insult)
    "pissuwa":   "crazy",    # extended / plural form
    "modaya":    "stupid",   # 'modaya'  = stupid person (strong insult)
    "moda":      "stupid",   # shorter form of modaya
    "harak":     "idiot",    # 'harak'   = idiot / bull (derogatory)
    "haraka":    "idiot",    # extended form
    "booru":     "stupid",   # 'booru'   = dumb / foolish
    "booruwa":   "stupid",   # extended form
    "gona":      "idiot",    # 'gona'    = bull / fool (derogatory)
    "gonaa":     "idiot",    # extended form
    "nayiya":    "idiot",    # 'nayiya'  = snake / sly idiot (insult)
    "balla":     "dog",      # 'balla'   = dog (used as insult)
    "balliya":   "dog",      # extended form
    "nariya":    "fox",      # 'nariya'  = fox / sly person (insult)
    "hora":      "thief",    # 'hora'    = thief / dishonest
    "horaa":     "thief",    # extended form
    "wesi":      "bad",      # 'wesi'    = bad / promiscuous (offensive)
    "huththa":   "bad",      # strong offensive term
    "huththo":   "bad",      # variant spelling
    "paka":      "dirty",    # 'paka'    = dirty / filthy
    "pakaya":    "dirty person", # extended form (very offensive)
    "kunu":      "dirty",    # 'kunu'    = garbage / dirty
    "kunuwa":    "dirty",    # extended form
    "kasada":    "bad",      # 'kasada'  = bad quality / inferior

    # ── Neutral Singlish filler words ──
    # Mewa dewal toxic na, but model eka confuse wenna puluwan nisaa English ekata map karala denawa
    "kamak":     "thing",    # 'kamak'  = a thing / something
    "ekak":      "one",      # 'ekak'   = one / a (article)
    "wada":      "work",     # 'wada'   = work / job
    "gedara":    "home",     # 'gedara' = home / house
    "giyaa":     "went",     # 'giyaa'  = went / gone
    "enawa":     "come",     # 'enawa'  = coming
    "yanawa":    "go",       # 'yanawa' = going
}


# ─────────────────────────────────────────────────────────────
# Module-level Singletons
# App start wena wita eka parak load karala memory eke keep karala denawa.
# Request ekeka pahala pahala load karanna epa — wasteful + slow wenawa.
# ─────────────────────────────────────────────────────────────

_model      = None   # Keras toxicity classifier model
_vectorizer = None   # TextVectorization layer — text eka number vectors walatat convert karala denawa


def _load_artifacts() -> None:
    """
    Model saha vectorizer first call wena wita load karala gannawa (lazy-load pattern).

    Already load wela thiyenawa nam subsequent calls eka skip wela yanawa — no-op.
    Meka private helper function ekak — views.py wala direct call karanna epa.
    get_toxicity() call karala wita internally auto-call wela model ready karala denawa.
    """
    global _model, _vectorizer

    # Model already memory eke load wela thiyenawa nam skip — otherwise load karala denawa
    if _model is None:
        _model = load_model(MODEL_PATH)

    # Vectorizer eka pickle file ekata serialize karala save wela thiyenawa — rebuild karanna ona
    if _vectorizer is None:
        with open(VECTORIZER_PATH, "rb") as fh:
            data = pickle.load(fh)   # {config: {...}, vocab: [...]} format ekata save wela thiyanawa

        # Saved config ekata use karala layer eka rebuild karala vocab set karala denawa
        config = data["config"]
        config["max_tokens"] = MAX_VOCAB          # memory overflow wenna epa kiyala cap karala denawa
        _vectorizer = TextVectorization.from_config(config)
        _vectorizer.set_vocabulary(data["vocab"][:MAX_VOCAB])


# ─────────────────────────────────────────────────────────────
# Text Pre-processing
# ML model ekata raw text directly denawa bari — issella clean karanna ona
# ─────────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    """
    User dena raw text eka ML model ekata pass karanna issella clean karala denawa.

    Karana steps:
      1. Uppercase -> lowercase  (e.g., 'HATE' -> 'hate')
      2. Singlish / slang -> English  (e.g., 'oya' -> 'you', 'pissu' -> 'crazy')
      3. Special characters remove karala denawa  (letters + digits + spaces matra thiyenawa)

    Args:
        text (str): User dena original raw message.

    Returns:
        str: Cleaned, normalized text — vectorizer ekata ready.
    """
    # Lowercase karala denawa — model eka 'Hate' saha 'hate' differently treat karanna epa
    text = text.lower()

    # Singlish words English walen replace karala denawa
    # Model eka English ekata train wela thiyenawa — singlish pass karanawa nam miss wela yanawa
    for slang, english in _SINGLISH_MAP.items():
        text = text.replace(slang, english)

    # Letters, digits, spaces matra allow karala denawa — punctuation saha symbols strip karala denawa
    text = re.sub(r"[^a-z0-9\s]", "", text)
    return text


# ─────────────────────────────────────────────────────────────
# Core Scoring Functions
# Text ekata toxicity score saha user behavior score calculate karala denawa
# ─────────────────────────────────────────────────────────────

def get_toxicity(text: str) -> float:
    """
    ML model ekata text pass karala toxicity score [0.0 – 1.0] return karala denawa.

    Model eka multi-label classifier ekak — 6 categories predict karala denawa:
        toxic, severe_toxic, obscene, threat, insult, identity_hate

    Final score = max over all 6 label predictions.
    Meaning: worst-case label eke score eka final score wela yanawa —
    eka category ekat wath high wuna thiyenawa nam detect wela yanawa.

    Args:
        text (str): User dena raw message (preprocessing internally handle karala denawa).

    Returns:
        float: Toxicity score — 0.0 (completely clean) to 1.0 (extremely toxic).
    """
    _load_artifacts()                           # model + vectorizer ready da kiyala check karala denawa
    cleaned    = _normalize(text)               # text eka lowercase + slang convert + symbols strip karala denawa
    vectorized = _vectorizer([cleaned])         # text eka model ekata ganna puluwan number vectors walatat convert karala denawa
    prediction = _model.predict(vectorized, verbose=0)[0]  # 6 label predictions array ekak return wela enawa

    # 6 labels walata max eka gannawa — worst-case label eka final toxicity score wela yanawa
    return float(max(prediction))


def get_behavior_score(user_history: list) -> float:
    """
    User eke past message history walata balala behavioral toxicity score eka calculate karala denawa.

    Simple average (mean) — user eke long-term behavior pattern eka capture karala denawa.
    Eka parak toxic message ekakata wada consistently toxic wena user kenekuta score eka
    naturally high wela yanawa — system eka eka 30% weight ekata consider karala denawa.

    Args:
        user_history (list): Past toxicity_score float values (most recent message first).

    Returns:
        float: Average behavioral score [0.0 – 1.0].
               History nattam (new user) 0.0 return karala denawa.
    """
    # History nattam — new user, no pattern, behavior score = 0.0
    if not user_history:
        return 0.0

    # Simple arithmetic mean — sum wala count walen divide karala denawa
    return sum(user_history) / len(user_history)


# ─────────────────────────────────────────────────────────────
# Strategy Helper Functions
# Strategy eka select una habata, actual text processing meka handle karala denawa
# ─────────────────────────────────────────────────────────────

# Toxic words (English + Singlish) -> gentle alternative replacements.
# blur_text() saha rewrite_text() functions deka mema dict eka use karala denawa.
# Key = toxic word (always lowercase), Value = gentle replacement phrase.
#
# NOTE: _SINGLISH_MAP eka ML scoring ekata (normalize step eke),
#       _REPLACEMENTS eka display processing ekata (blur / rewrite step eke).
#       Deka duwa different purposes serve karala denawa — separately maintain karala denawa.
_REPLACEMENTS: dict[str, str] = {
    # ── English toxic words ──
    "hate":      "dislike",                  # strong negative feeling
    "idiot":     "person",                   # personal attack
    "stupid":    "not very smart",           # intelligence-based insult
    "ugly":      "not attractive",           # appearance-based insult
    "dumb":      "less informed",            # intelligence-based insult
    "kill":      "hurt",                     # violent language
    "fuck":      "mess",                     # strong profanity
    "fucking":   "very",                     # profanity used as an intensifier
    "shit":      "bad",                      # profanity
    "bitch":     "person",                   # gendered insult
    "bad":       "needs improvement",        # negative generalisation
    "useless":   "not very helpful",         # dismissive insult
    "worst":     "not the best experience",  # extreme negative
    "crazy":     "silly",                    # mental health stigma language
    "moron":     "person",                   # intelligence-based insult
    "loser":     "person",                   # social-status attack
    "trash":     "not great",               # dismissive
    "garbage":   "not great",               # dismissive
    "damn":      "darn",                     # mild profanity
    "hell":      "heck",                     # mild profanity

    # ── Singlish / Sri Lankan slang toxic words ──
    # Mewa _SINGLISH_MAP eka ekat overlap wenna puluwan —
    # _SINGLISH_MAP normalize karagena ML scoring karala, _REPLACEMENTS display eke
    # singlish as-is thiyena situations walata (mixed-language messages) catch karala denawa
    "pissu":     "silly",                    # 'pissu'   = crazy
    "pissuwa":   "silly",                    # extended form
    "modaya":    "not very smart person",    # 'modaya'  = stupid person (strong)
    "moda":      "not very smart",           # shorter form
    "harak":     "not nice",                 # 'harak'   = idiot / derogatory
    "haraka":    "not nice",                 # extended form
    "booru":     "not very smart",           # 'booru'   = dumb
    "booruwa":   "not very smart",           # extended form
    "gona":      "not very smart",           # 'gona'    = bull / fool
    "gonaa":     "not very smart",           # extended form
    "nayiya":    "not a good person",        # 'nayiya'  = snake / sly insult
    "balla":     "not a nice person",        # 'balla'   = dog (insult)
    "balliya":   "not a nice person",        # extended form
    "nariya":    "not trustworthy",          # 'nariya'  = fox / sly person
    "hora":      "not honest",              # 'hora'    = thief
    "horaa":     "not honest",              # extended form
    "wesi":      "not good",                 # 'wesi'    = bad / promiscuous
    "huththa":   "not okay",                 # strong offensive term
    "huththo":   "not okay",                 # variant spelling
    "paka":      "not clean",               # 'paka'    = dirty
    "pakaya":    "not a nice person",        # extended, very offensive
    "kunu":      "not clean",               # 'kunu'    = garbage / dirty
    "kunuwa":    "not clean",               # extended form
    "kasada":    "not good quality",         # 'kasada'  = bad / inferior
    "umba":      "you",                      # 'umba'    = you (rude form — soften)
    "uba":       "you",                      # 'uba'     = you (very rude — soften)
}

# _REPLACEMENTS dict eke keys set ekatak convert karala denawa — O(1) lookup ekata
# Dict lookup O(1) thiyenawa wage set lookup wath O(1) — but set eka memory eke
# separately store wenawa nisaa explicit karaganna hari
_TOXIC_WORDS = set(_REPLACEMENTS.keys())

# Token ekakata thiyana leading/trailing punctuation split karanna regex pattern.
# e.g., '"stupid!"' -> prefix='"', core='stupid', suffix='!'
# re.UNICODE flag — Sinhala / emoji / unicode characters properly handle karala denawa
_WORD_PATTERN = re.compile(r"^([^\w']*)(\w[\w']*\w|\w)([^\w']*)$", re.UNICODE)


def _apply_case(original: str, replacement: str) -> str:
    """
    Original toxic word eke casing pattern eka replacement word ekatath apply karala denawa.

    User 'STUPID' kiyala type karanawa nam -> 'NOT VERY SMART' (all caps)
    User 'Stupid' kiyala type karanawa nam -> 'Not very smart' (title case)
    Lowercase dunna nam -> 'not very smart' (unchanged)

    Meka nisa replace wena wita user eke original typing style eka preserve wela yanawa.

    Args:
        original (str):    Original toxic word eke casing preserving string.
        replacement (str): Gentle replacement word (lowercase expected).

    Returns:
        str: Replacement with original casing pattern applied.
    """
    if original.isupper():              # ALL CAPS -> REPLACEMENT UPPER
        return replacement.upper()
    if original[0].isupper():           # Title Case -> Title case replacement
        return replacement[0].upper() + replacement[1:]
    return replacement                  # lowercase -> replacement as-is


def _process_word(word: str, transform) -> str:
    """
    Token ekak ekata thiyana punctuation (prefix + suffix) separate karala,
    core word eka transform karala, punctuation wapas attach karala denawa.

    Meka nisa 'stupid!' kiyala dunna wita '!' eka missing wenna epa.
    e.g., prefix='', core='stupid', suffix='!' -> transform('stupid') + '!' -> 'not very smart!'

    Args:
        word (str):  Single whitespace-split token — may have surrounding punctuation.
        transform:   Callable (core: str) -> str.
                     e.g., _replace_toxic_core or _blur_toxic_core

    Returns:
        str: Transformed token with original surrounding punctuation preserved.
    """
    match = _WORD_PATTERN.match(word)
    if not match:
        # Regex match wunne nattam — pure punctuation token wenna puluwan, unchanged denawa
        return word
    prefix, core, suffix = match.groups()   # punctuation saha core word separate karala gannawa
    new_core = transform(core)              # core word eka transform karala denawa
    return prefix + new_core + suffix       # punctuation wapas attach karala return karala denawa


def _replace_toxic_core(core: str) -> str:
    """
    Single word core ekak _TOXIC_WORDS eke thiyanawa da balala,
    thiyanawa nam gentle replacement eka return karala denawa.
    Original casing preserve karanna _apply_case() use karala denawa.

    rewrite_text() ekata _process_word() through call wela enawa — direct call karanna epa.

    Args:
        core (str): Word core — surrounding punctuation already removed.

    Returns:
        str: Gentle replacement (with matched casing) if toxic, else original unchanged.
    """
    lower = core.lower()                            # case-insensitive compare ekata lowercase
    if lower not in _TOXIC_WORDS:
        return core                                 # toxic na — unchanged return karala denawa
    return _apply_case(core, _REPLACEMENTS[lower])  # toxic — replace + casing preserve karala denawa


def _blur_toxic_core(core: str) -> str:
    """
    Single word core ekak toxic da balala, toxic wena nam '****' return karala denawa.
    Toxic nattam original core eka unchanged return karala denawa.

    blur_text() ekata _process_word() through call wela enawa — direct call karanna epa.

    Args:
        core (str): Word core — surrounding punctuation already removed.

    Returns:
        str: '****' if the word is toxic, else original core unchanged.
    """
    if core.lower() in _TOXIC_WORDS:    # toxic word da kiyala check karala denawa
        return "****"                   # toxic — censor karala denawa
    return core                         # clean — unchanged return karala denawa


def blur_text(text: str) -> str:
    """
    Blurring strategy — known toxic words **** walen replace karala denawa.
    Length-based blurring na, word-list based — precise saha accurate.

    Example:
        "you are stupid"         -> "you are ****"
        "Machan pissu post ekak" -> "Machan **** post ekak"

    Args:
        text (str): Original user message.

    Returns:
        str: Message with toxic words censored as ****, clean words unchanged.
    """
    words = text.split()
    # Pata pata word eka _process_word ekata pass karala denawa — punctuation preserve wela yanawa
    return " ".join(_process_word(w, _blur_toxic_core) for w in words)


def rewrite_text(text: str) -> str:
    """
    Rewriting strategy — toxic words _REPLACEMENTS dict ekata use karala
    gentler alternatives walen substitute karala denawa.

    Punctuation saha mixed English/Singlish messages correctly handle karala denawa.
    Sesh wena positive-tone suffix ekak append karala denawa.

    Example:
        "I hate you"             -> "I dislike you 🙂 Let's keep it positive."
        "Machan pissu post ekak" -> "Machan silly post ekak 🙂 Let's keep it positive."

    Args:
        text (str): Original user message.

    Returns:
        str: Rewritten message with toxic words swapped + positivity suffix appended.
    """
    words = text.split()
    # Pata pata word eka toxic da balala replace karala denawa — punctuation safe
    new_words = [_process_word(w, _replace_toxic_core) for w in words]
    return " ".join(new_words) + " 🙂 Let's keep it positive."


def _contains_toxic_words(text: str) -> bool:
    """
    Message eke _TOXIC_WORDS eke thiyana word ekak wadawath thiyanawa da kiyala check karala denawa.

    Safe branch eke use karala denawa — ML score eka low wunath (< 0.30),
    message eke display-level toxic words thiyanawa nam rewrite strategy apply karala denawa.
    Meka extra safety layer ekak — score eka low wena borderline cases wath cover karala denawa.

    Args:
        text (str): User message to scan for toxic words.

    Returns:
        bool: True — at least one toxic word thiyanawa.
              False — siyalu words clean, message safe.
    """
    for word in text.split():
        # Punctuation strip karala core word eka extract karala denawa
        match = _WORD_PATTERN.match(word)
        core  = match.group(2).lower() if match else word.lower()
        if core in _TOXIC_WORDS:    # toxic word detect una — immediately True return karala denawa
            return True
    return False                    # loop siyalla passuna, toxic words nattam — safe message


def emotional_support() -> str:
    """
    Safe strategy eke result ekata attach karanna empathetic support message eka return karala denawa.

    ML score eka low wunath message eka mildly sensitive wenna puluwan —
    user eka notify karala emotional wellbeing ekak remind karala denawa.

    Returns:
        str: Static supportive message string with 💙 emoji.
    """
    return (
        "💙 This message may be hurtful. "
        "Stay positive and consider taking a break or talking to someone you trust."
    )


# ─────────────────────────────────────────────────────────────
# Main AESM Engine — Siyallata Entry Point
# Meka call karala message eka pass karala denawa — result dict ekak return wela enawa
# ─────────────────────────────────────────────────────────────

def aesm_engine(text: str, user_history: list = None) -> dict:
    """
    Adaptive Emotional Shielding Module eke main entry point.

    Incoming message eka receive karala:
      1. Toxicity score (ML model) saha behavior score (history average) calculate karala denawa
      2. Weighted final_score eka determine karala denawa
      3. Score ekata anuwawa correct strategy eka select karala processed result return karala denawa

    Weighted formula:
        final_score = (toxicity * 0.7) + (behavior * 0.3)
        [Current message: 70% weight | Past behavior: 30% weight]

    Strategy thresholds:
        >= 0.85  ->  Filtering  — message block karala denawa, too dangerous
        >= 0.65  ->  Blurring   — toxic words **** walen censor karala denawa
        >= 0.30  ->  Rewriting  — gentle alternatives walen rewrite karala denawa
         < 0.30  ->  Safe       — message pass karala, support note attach karala denawa
                                  (display-level toxic words thiyanawa nam wath rewrite karala denawa)

    Args:
        text (str):
            Incoming user message — raw text, no preprocessing needed here.
        user_history (list, optional):
            User eke recent toxicity score list (float values, most recent first).
            None dunna nam empty list ekatak treat karala denawa — new user default.

    Returns:
        dict: Result containing:
            strategy     (str)   — applied strategy name
            output       (str)   — processed / display-ready message
            toxicity     (float) — raw ML score, 4 dp rounded
            behavior     (float) — behavioral average score, 4 dp rounded
            final_score  (float) — weighted composite score, 4 dp rounded
            new_toxicity (float) — rewritten text eke re-scored toxicity (Rewriting only)
            support      (str)   — emotional support note (Safe only)
    """
    # user_history None dunna nam new user scenario — empty list ekatak default karala denawa
    if user_history is None:
        user_history = []

    # ── Step 1: Toxicity saha behavior scores calculate karala gannawa ──
    toxicity    = get_toxicity(text)               # current message eke ML toxicity score
    behavior    = get_behavior_score(user_history)  # user eke past behavior average score
    final_score = (toxicity * 0.7) + (behavior * 0.3)  # weighted composite score

    # ── Step 2: Score metadata — siyalu strategy responses walata common fields ──
    scores = {
        "toxicity":    round(toxicity,    4),
        "behavior":    round(behavior,    4),
        "final_score": round(final_score, 4),
    }

    # ── Step 3: final_score ekata anuwawa correct strategy eka select karala result return ──

    if final_score >= 0.85:
        # FILTERING — message eka danena passa thiyanawa kiyala yanna bari — completely block karala denawa
        return {
            "strategy": "Filtering",
            "output":   "🚫 Message hidden due to high toxicity",
            **scores,
        }

    elif final_score >= 0.65:
        # BLURRING — message eka fully block karaganna epa, but toxic words matra
        # **** walen hide karala denawa — partial censorship
        return {
            "strategy": "Blurring",
            "output":   blur_text(text),
            **scores,
        }

    elif final_score >= 0.30:
        # REWRITING — toxic words gentle alternatives walen replace karala denawa
        # Sesh wena positivity suffix ekak add karala user eka nudge karala denawa
        rewritten = rewrite_text(text)
        return {
            "strategy":    "Rewriting",
            "output":       rewritten,
            "new_toxicity": round(get_toxicity(rewritten), 4),  # rewrite karana passat score eka check karala denawa
            **scores,
        }

    else:
        # SAFE — ML score eka < 0.30, model eka toxic lesa classify karanne na.
        # But display-level check ekakath hadana genawa:
        # _TOXIC_WORDS walata match wena words message eke thiyanawa nam,
        # score eka low wunath rewrite apply karala denawa — extra safety net ekak.
        if _contains_toxic_words(text):
            # ML score low, but display-level toxic words detect una — Rewriting apply karala denawa
            rewritten = rewrite_text(text)
            return {
                "strategy":     "Rewriting",
                "output":        rewritten,
                "new_toxicity":  round(get_toxicity(rewritten), 4),  # rewrite karana passat score check
                **scores,
            }

        # Completely clean message — pass karala denawa + emotional support note attach karala denawa
        return {
            "strategy": "Safe",
            "output":   text,
            "support":  emotional_support(),
            **scores,
        }