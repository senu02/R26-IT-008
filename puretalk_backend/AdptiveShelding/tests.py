"""
============================================================
Adaptive Emotional Shielding Module (AESM) — Unit Tests
============================================================
මෙම test file eka AESM engine ගේ සියලු components verify කරනවා.

Coverage:
    - Text normalization (_normalize)
    - Score helpers (get_behavior_score)
    - Strategy helpers (blur_text, rewrite_text)
    - Emotional support message
    - Full aesm_engine pipeline (all 4 strategies)
    - Edge cases (empty input, boundary scores)

NOTE: ML model load කිරීම mock කරනවා — real model files නැතිව tests run කරන්න පුළුවන්.

Run:
    cd puretalk_backend
    python manage.py test adptiveShelding
"""

from unittest.mock import patch, MagicMock
from django.test import TestCase

from .engine import (
    _normalize,
    get_behavior_score,
    blur_text,
    rewrite_text,
    emotional_support,
    aesm_engine,
)


# ─────────────────────────────────────────────────────────────
# Helper: mock get_toxicity so ML model load නොකෙරේ
# ─────────────────────────────────────────────────────────────
def _mock_engine_with_score(fixed_score: float):
    """
    aesm_engine tests ට get_toxicity fixed score return කරන mock patch return කරනවා.
    Usage:  with _mock_engine_with_score(0.9): ...
    """
    return patch(
        "adptiveShelding.engine.get_toxicity",
        return_value=fixed_score,
    )


# ═══════════════════════════════════════════════════════════════
# 1. Text Normalization Tests
# ═══════════════════════════════════════════════════════════════
class NormalizeTextTests(TestCase):
    """_normalize() function ගේ behaviour verify කරනවා."""

    def test_lowercase_conversion(self):
        """Uppercase text lowercase කෙරෙනවා ද?"""
        self.assertEqual(_normalize("HELLO WORLD"), "hello world")

    def test_singlish_oya_replaced(self):
        """'oya' → 'you' replace කෙරෙනවා ද?"""
        self.assertIn("you", _normalize("oya is bad"))

    def test_singlish_pissu_replaced(self):
        """'pissu' → 'crazy' replace කෙරෙනවා ද?"""
        self.assertIn("crazy", _normalize("pissu minihek"))

    def test_singlish_wesi_replaced(self):
        """'wesi' → 'bad' replace කෙරෙනවා ද?"""
        self.assertIn("bad", _normalize("wesi kamak"))

    def test_special_chars_removed(self):
        """Special characters strip කෙරෙනවා ද?"""
        result = _normalize("hello! @world# $how%")
        self.assertNotIn("!", result)
        self.assertNotIn("@", result)
        self.assertNotIn("#", result)

    def test_numbers_preserved(self):
        """Numbers text eke remain වෙනවා ද?"""
        self.assertIn("123", _normalize("abc 123"))

    def test_empty_string(self):
        """Empty input → empty output."""
        self.assertEqual(_normalize(""), "")


# ═══════════════════════════════════════════════════════════════
# 2. Behavior Score Tests
# ═══════════════════════════════════════════════════════════════
class BehaviorScoreTests(TestCase):
    """get_behavior_score() function verify කරනවා."""

    def test_empty_history_returns_zero(self):
        """History නැති user ට score 0.0 ද?"""
        self.assertEqual(get_behavior_score([]), 0.0)

    def test_single_score(self):
        """Single history item → same value return."""
        self.assertAlmostEqual(get_behavior_score([0.8]), 0.8)

    def test_average_of_multiple_scores(self):
        """Multiple scores correctly averaged ද?"""
        scores = [0.2, 0.4, 0.6]
        self.assertAlmostEqual(get_behavior_score(scores), 0.4, places=5)

    def test_all_zero_scores(self):
        """All-zero history → 0.0 score."""
        self.assertEqual(get_behavior_score([0.0, 0.0, 0.0]), 0.0)

    def test_all_max_scores(self):
        """All-max history → 1.0 score."""
        self.assertAlmostEqual(get_behavior_score([1.0, 1.0, 1.0]), 1.0)


# ═══════════════════════════════════════════════════════════════
# 3. Blur Text Tests
# ═══════════════════════════════════════════════════════════════
class BlurTextTests(TestCase):
    """blur_text() Blurring strategy verify කරනවා."""

    def test_toxic_words_blurred(self):
        """Known toxic words **** වලට replace ද?"""
        result = blur_text("stupid")
        self.assertEqual(result, "****")

    def test_clean_words_unchanged(self):
        """Non-toxic words unchanged ම pass ද?"""
        result = blur_text("hi ok me")
        self.assertEqual(result, "hi ok me")

    def test_mixed_toxic_and_clean_words(self):
        """Toxic + clean words mix correctly handled ද?"""
        result = blur_text("you are stupid")
        self.assertIn("****", result)
        self.assertIn("you", result)
        self.assertIn("are", result)

    def test_singlish_toxic_word_blurred(self):
        """Singlish toxic word blur වෙනවා ද?"""
        result = blur_text("Machan pissu post ekak")
        self.assertIn("****", result)
        self.assertIn("Machan", result)

    def test_punctuation_preserved(self):
        """Punctuation unchanged when toxic word blurred ද?"""
        result = blur_text("I hate this!")
        self.assertEqual(result, "I **** this!")

    def test_empty_string(self):
        """Empty string → empty string."""
        self.assertEqual(blur_text(""), "")


# ═══════════════════════════════════════════════════════════════
# 4. Rewrite Text Tests
# ═══════════════════════════════════════════════════════════════
class RewriteTextTests(TestCase):
    """rewrite_text() Rewriting strategy verify කරනවා."""

    def test_known_toxic_word_replaced(self):
        """'hate' → 'dislike' replace ද?"""
        result = rewrite_text("I hate you")
        self.assertIn("dislike", result)
        self.assertNotIn("hate", result)

    def test_positive_suffix_appended(self):
        """Positive suffix message append ද?"""
        result = rewrite_text("you are stupid")
        self.assertIn("Let's keep it positive", result)

    def test_unknown_words_preserved(self):
        """_REPLACEMENTS ලිස්ට් නැති words unchanged ද?"""
        result = rewrite_text("hello world")
        self.assertIn("hello", result)
        self.assertIn("world", result)

    def test_singlish_word_replaced(self):
        """Singlish toxic word gentle alternative එකකට replace ද?"""
        result = rewrite_text("Machan pissu post ekak")
        self.assertIn("silly", result)
        self.assertNotIn("pissu", result)

    def test_punctuation_preserved(self):
        """Punctuation attached words correctly replaced ද?"""
        result = rewrite_text("I hate this!")
        self.assertIn("dislike", result)
        self.assertIn("this!", result)

    def test_empty_string(self):
        """Empty string → suffix only."""
        result = rewrite_text("")
        self.assertIn("Let's keep it positive", result)


# ═══════════════════════════════════════════════════════════════
# 5. Emotional Support Tests
# ═══════════════════════════════════════════════════════════════
class EmotionalSupportTests(TestCase):
    """emotional_support() function verify කරනවා."""

    def test_returns_string(self):
        """String return ද?"""
        self.assertIsInstance(emotional_support(), str)

    def test_contains_emoji(self):
        """Support message eke emoji ද?"""
        self.assertIn("💙", emotional_support())

    def test_not_empty(self):
        """Empty string නොවෙනවා ද?"""
        self.assertTrue(len(emotional_support()) > 0)


# ═══════════════════════════════════════════════════════════════
# 6. AESM Engine — Strategy Pipeline Tests
# ═══════════════════════════════════════════════════════════════
class AESMEngineStrategyTests(TestCase):
    """
    aesm_engine() ගේ strategy selection verify කරනවා.
    get_toxicity mock කරා — ML model load නොකෙරෙනවා.
    """

    # ── Filtering (final_score ≥ 0.85) ──────────────────────
    def test_filtering_strategy_high_toxicity(self):
        """Very toxic message → Filtering strategy."""
        with _mock_engine_with_score(0.95):
            result = aesm_engine("I hate you", user_history=[0.9, 0.9])
        self.assertEqual(result["strategy"], "Filtering")
        self.assertIn("hidden", result["output"])

    def test_filtering_strategy_at_exact_boundary(self):
        """Score exactly 0.85 → Filtering strategy (boundary test)."""
        # toxicity=0.85, behavior=0.0 → final = 0.85*0.7 = 0.595 ... need behavior too
        # To get exactly 0.85: toxicity=1.0, behavior=0.5 → 0.7+0.15 = 0.85
        with _mock_engine_with_score(1.0):
            result = aesm_engine("test", user_history=[0.5])
        self.assertEqual(result["strategy"], "Filtering")

    # ── Blurring (0.65 ≤ final_score < 0.85) ────────────────
    def test_blurring_strategy(self):
        """Moderately toxic message → Blurring strategy."""
        with _mock_engine_with_score(0.75):
            result = aesm_engine("you are stupid", user_history=[0.5])
        self.assertEqual(result["strategy"], "Blurring")
        self.assertIn("****", result["output"])

    def test_blurring_boundary_lower(self):
        """Score exactly 0.65 → Blurring strategy."""
        # toxicity=0.80, behavior=0.20 → 0.56 + 0.06 = 0.62... use 0.93, 0.0 → 0.651
        # Simpler: toxicity=1.0, behavior=0.0 → final=0.70 ✓ Blurring
        # But need final in [0.65, 0.85): toxicity=0.70, behavior=0.60
        # → 0.49 + 0.18 = 0.67 ✓
        with _mock_engine_with_score(0.70):
            result = aesm_engine("test", user_history=[0.60])
        self.assertEqual(result["strategy"], "Blurring")

    # ── Rewriting (0.30 ≤ final_score < 0.65) ───────────────
    def test_rewriting_strategy_mild(self):
        """Mildly toxic message → Rewriting strategy."""
        with _mock_engine_with_score(0.40):
            result = aesm_engine("you are stupid", user_history=[0.2])
        self.assertEqual(result["strategy"], "Rewriting")
        self.assertIn("Let's keep it positive", result["output"])

    def test_rewriting_strategy_moderate(self):
        """Moderately toxic message → Rewriting (no Warning)."""
        with _mock_engine_with_score(0.55):
            result = aesm_engine("I hate this", user_history=[0.3])
        self.assertEqual(result["strategy"], "Rewriting")
        self.assertIn("dislike", result["output"])

    def test_rewriting_includes_new_toxicity(self):
        """Rewriting result eke new_toxicity key ද?"""
        # Need final_score in [0.30, 0.45): toxicity=0.50, behavior=0.20
        # → final = 0.35 + 0.06 = 0.41 ✓ Rewriting
        with _mock_engine_with_score(0.50):
            result = aesm_engine("I hate you", user_history=[0.20])
        self.assertIn("new_toxicity", result)

    # ── Safe (final_score < 0.30) ────────────────────────────
    def test_safe_strategy_clean_message(self):
        """Clean message → Safe strategy."""
        with _mock_engine_with_score(0.05):
            result = aesm_engine("Hello, how are you?", user_history=[])
        self.assertEqual(result["strategy"], "Safe")
        self.assertEqual(result["output"], "Hello, how are you?")

    def test_toxic_word_triggers_rewrite_on_low_score(self):
        """Known toxic word + low ML score → still Rewriting."""
        with _mock_engine_with_score(0.05):
            result = aesm_engine("I hate this post", user_history=[])
        self.assertEqual(result["strategy"], "Rewriting")
        self.assertIn("dislike", result["output"])

    def test_safe_strategy_includes_support(self):
        """Safe result eke support key ද?"""
        with _mock_engine_with_score(0.10):
            result = aesm_engine("Good morning!", user_history=[])
        self.assertIn("support", result)


# ═══════════════════════════════════════════════════════════════
# 7. AESM Engine — Score Calculation Tests
# ═══════════════════════════════════════════════════════════════
class AESMEngineScoreTests(TestCase):
    """aesm_engine() score calculation verify කරනවා."""

    def test_scores_present_in_all_strategies(self):
        """සියලු responses ට toxicity, behavior, final_score ද?"""
        with _mock_engine_with_score(0.1):
            result = aesm_engine("nice message", user_history=[0.05])
        self.assertIn("toxicity",    result)
        self.assertIn("behavior",    result)
        self.assertIn("final_score", result)

    def test_score_weighted_formula(self):
        """final_score = toxicity*0.7 + behavior*0.3 formula correct ද?"""
        tox = 0.5
        hist = [0.4, 0.4]  # avg behavior = 0.4
        expected_final = round((tox * 0.7) + (0.4 * 0.3), 4)  # 0.35+0.12=0.47

        with _mock_engine_with_score(tox):
            result = aesm_engine("test message", user_history=hist)
        self.assertAlmostEqual(result["final_score"], expected_final, places=3)

    def test_scores_rounded_to_4dp(self):
        """Scores 4 decimal places ට round ද?"""
        with _mock_engine_with_score(0.123456789):
            result = aesm_engine("test", user_history=[0.1])
        # Verify rounding precision
        self.assertEqual(result["toxicity"], round(0.123456789, 4))

    def test_no_user_history_defaults_to_empty(self):
        """user_history=None ට error නැතිව handle ද?"""
        with _mock_engine_with_score(0.1):
            result = aesm_engine("hello", user_history=None)
        self.assertIn("strategy", result)

    def test_empty_user_history(self):
        """Empty list history → behavior=0.0."""
        with _mock_engine_with_score(0.1):
            result = aesm_engine("hello", user_history=[])
        self.assertEqual(result["behavior"], 0.0)


# ═══════════════════════════════════════════════════════════════
# 8. Edge Case Tests
# ═══════════════════════════════════════════════════════════════
class EdgeCaseTests(TestCase):
    """Boundary conditions සහ edge cases verify කරනවා."""

    def test_empty_text_does_not_crash(self):
        """Empty string input → crash නොවෙනවා ද?"""
        with _mock_engine_with_score(0.0):
            result = aesm_engine("", user_history=[])
        self.assertIn("strategy", result)

    def test_very_long_text(self):
        """Long text (1000+ chars) → crash නොවෙනවා ද?"""
        long_text = "hello world " * 100
        with _mock_engine_with_score(0.2):
            result = aesm_engine(long_text, user_history=[])
        self.assertIn("strategy", result)

    def test_only_special_characters(self):
        """Special chars only text → crash නොවෙනවා ද?"""
        with _mock_engine_with_score(0.0):
            result = aesm_engine("!!! @@@ ###", user_history=[])
        self.assertIn("strategy", result)

    def test_unicode_emoji_text(self):
        """Emoji ඇති text → crash නොවෙනවා ද?"""
        with _mock_engine_with_score(0.05):
            result = aesm_engine("Hello 😊 how are you 🎉", user_history=[])
        self.assertIn("strategy", result)

    def test_high_behavior_pushes_strategy_up(self):
        """Low toxicity but high behavior history → higher strategy selected."""
        with _mock_engine_with_score(0.3):
            result = aesm_engine("you are bad", user_history=[1.0])
        self.assertIn(result["strategy"], ["Rewriting", "Blurring", "Filtering"])
