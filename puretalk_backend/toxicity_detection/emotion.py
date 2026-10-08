"""Speech emotion inference for the toxicity detection research pipeline."""

import logging
import io
import os
from typing import Any

logger = logging.getLogger(__name__)

DEFAULT_EMOTION_MODEL = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
_classifier = None
_load_attempted = False


def _get_classifier():
    """Load the pretrained classifier once, without affecting text inference."""
    global _classifier, _load_attempted

    if _load_attempted:
        return _classifier

    _load_attempted = True
    try:
        from transformers import pipeline

        model_name = os.getenv("TOXICITY_EMOTION_MODEL", DEFAULT_EMOTION_MODEL)
        _classifier = pipeline(
            "audio-classification",
            model=model_name,
            top_k=None,
        )
        logger.info("Speech emotion model loaded: %s", model_name)
    except Exception as exc:
        logger.warning("Speech emotion model unavailable: %s", exc)
        _classifier = None

    return _classifier


def _load_audio(audio_source: bytes | bytearray | str) -> tuple[Any, int]:
    """Decode audio in Python and return a mono waveform plus sample rate."""
    try:
        import numpy as np
        import soundfile as sf

        if isinstance(audio_source, (bytes, bytearray)):
            waveform, sample_rate = sf.read(
                io.BytesIO(audio_source), dtype="float32"
            )
        else:
            waveform, sample_rate = sf.read(audio_source, dtype="float32")

        if getattr(waveform, "ndim", 1) > 1:
            waveform = np.mean(waveform, axis=1)

        target_rate = 16000
        if sample_rate != target_rate:
            import librosa

            waveform = librosa.resample(
                waveform,
                orig_sr=sample_rate,
                target_sr=target_rate,
            )
            sample_rate = target_rate

        return waveform, sample_rate
    except Exception as exc:
        raise ValueError(
            "Audio emotion analysis supports readable WAV/PCM audio. "
            "The uploaded audio could not be decoded without FFmpeg."
        ) from exc


def analyse_audio_emotion(audio_source: bytes | bytearray | str) -> dict[str, Any]:
    """Return pretrained speech-emotion probabilities without FFmpeg."""
    classifier = _get_classifier()
    if classifier is None:
        return {
            "available": False,
            "model": os.getenv("TOXICITY_EMOTION_MODEL", DEFAULT_EMOTION_MODEL),
            "probabilities": {},
            "error": "Speech emotion model is not available",
        }

    try:
        waveform, sample_rate = _load_audio(audio_source)
        predictions = classifier({"array": waveform, "sampling_rate": sample_rate})
        probabilities = {
            str(item["label"]): float(item["score"])
            for item in predictions
        }
        return {
            "available": True,
            "model": os.getenv("TOXICITY_EMOTION_MODEL", DEFAULT_EMOTION_MODEL),
            "probabilities": probabilities,
            "error": None,
        }
    except Exception as exc:
        logger.exception("Speech emotion inference failed")
        return {
            "available": True,
            "model": os.getenv("TOXICITY_EMOTION_MODEL", DEFAULT_EMOTION_MODEL),
            "probabilities": {},
            "error": str(exc),
        }
