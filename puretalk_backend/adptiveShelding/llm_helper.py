import os
import google.generativeai as genai

# ============================================================
# LLM Integration for Singlish Support
# ============================================================
# This module uses the Gemini API to dynamically understand and
# process Singlish (Romanized Sinhala) words that our local ML model
# and dictionaries might miss.
# ============================================================

# Load API key from environment variables
_API_KEY = os.environ.get("GEMINI_API_KEY", "")

if _API_KEY:
    genai.configure(api_key=_API_KEY)
    # Use Gemini 1.5 Flash as it is fast and suitable for rapid text tasks
    try:
        _model = genai.GenerativeModel("gemini-1.5-flash")
    except Exception:
        _model = None
else:
    _model = None


def _call_llm(prompt: str, fallback: str) -> str:
    """
    Helper function to safely call the Gemini API.
    If the API key is missing or a network error occurs, it returns the fallback string.
    """
    if not _model or not _API_KEY:
        return fallback

    try:
        response = _model.generate_content(prompt)
        if response.text:
            return response.text.strip().strip('"').strip("'")
        return fallback
    except Exception as e:
        print(f"[AESM LLM Warning] LLM call failed: {e}")
        return fallback


def translate_to_english(text: str) -> str:
    """
    Translates Singlish/Sinhala text to English.
    This is used BEFORE passing the text to the ML Toxicity model,
    so the English-trained model can accurately score Singlish toxicity.
    """
    prompt = f"""
    You are an expert translator. 
    If the following text is in Singlish (Romanized Sinhala), translate it accurately to English.
    If the text is already in English, leave it exactly as it is.
    Do NOT add any explanations, quotes, or conversational text. Output ONLY the resulting English text.

    Text: "{text}"
    """
    return _call_llm(prompt, fallback=text)


def blur_toxic_words_with_llm(original_text: str) -> str:
    """
    Identifies toxic words in the original language (Singlish or English)
    and replaces them with '****'. Used for the Blurring strategy.
    """
    prompt = f"""
    You are a strict text moderator. The following text contains toxic, offensive, or inappropriate words in English or Singlish (Romanized Sinhala).
    Please replace ONLY the toxic/offensive words with '****'. 
    Keep the rest of the sentence exactly the same, in its ORIGINAL LANGUAGE. Do not translate the safe words to English.
    Do NOT add any explanations or quotes. Output ONLY the censored text.

    Text: "{original_text}"
    """
    return _call_llm(prompt, fallback=original_text)


def rewrite_with_llm(original_text: str) -> str:
    """
    Rewrites toxic text into a gentle, neutral version in the SAME language.
    Used for the Rewriting strategy.
    """
    prompt = f"""
    You are a friendly text moderator. The following text contains aggressive, toxic, or offensive words in English or Singlish (Romanized Sinhala).
    Please rewrite the text to be gentle and neutral, replacing the offensive words with polite alternatives.
    CRITICAL: You MUST write the response in the SAME LANGUAGE as the original text (e.g., if it is Singlish, reply in Singlish).
    Do NOT add any explanations or quotes. Output ONLY the rewritten text.

    Text: "{original_text}"
    """
    rewritten = _call_llm(prompt, fallback=original_text)
    
    # Append the positivity suffix if the LLM successfully changed the text
    if rewritten != original_text:
        return rewritten + " 🙂 Let's keep it positive."
    return original_text
