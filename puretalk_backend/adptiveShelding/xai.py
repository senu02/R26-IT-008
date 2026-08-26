"""
LIME-style word-level explanations for AESM toxicity predictions.
Uses local occlusion perturbation (model-agnostic) to identify
which words most influenced the toxicity score.
"""

from .engine import get_toxicity


def get_lime_word_explanation(text: str, top_n: int = 5) -> dict:
    """
    LIME (Local Interpretable Model-Agnostic Explanations) for text.

    Masks each word individually and measures the change in toxicity score
    to estimate local feature importance.

    Returns:
        {
            'method': 'LIME',
            'base_score': float,
            'words': [
                {'word': str, 'importance': float, 'direction': str},
                ...
            ],
        }
    """
    words = text.split()
    if not words:
        return {'method': 'LIME', 'base_score': 0.0, 'words': []}

    base_score = get_toxicity(text)
    contributions = []

    for i, word in enumerate(words):
        if len(word.strip()) <= 1:
            continue
        masked_words = words[:i] + words[i + 1:]
        masked_text = ' '.join(masked_words)
        masked_score = get_toxicity(masked_text) if masked_text.strip() else 0.0
        importance = base_score - masked_score
        if abs(importance) < 0.0001:
            continue
        contributions.append({
            'word': word,
            'importance': round(importance, 4),
            'direction': (
                'increases_toxicity' if importance > 0 else 'decreases_toxicity'
            ),
        })

    contributions.sort(key=lambda x: abs(x['importance']), reverse=True)
    return {
        'method': 'LIME',
        'base_score': round(base_score, 4),
        'words': contributions[:top_n],
    }
