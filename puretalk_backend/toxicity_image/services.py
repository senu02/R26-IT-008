"""
Image toxicity detection service.
Loads the trained MobileNetV2 model (best_toxic_model.h5) and runs inference.

Model path priority:
  1. BASE_DIR/model/toxicity_image/best_toxic_model.h5   (production)
  2. BASE_DIR/best_toxic_model.h5                         (dev fallback)
"""

import os
import io
import logging
import numpy as np
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
#  Constants – must match your training script                         #
# ------------------------------------------------------------------ #
IMG_SIZE = (224, 224)
TOXIC_THRESHOLD = 0.5   # sigmoid output: >= this → toxic

# ------------------------------------------------------------------ #
#  Lazy model loader                                                   #
# ------------------------------------------------------------------ #
_model = None
_model_load_attempted = False


def _get_model():
    """Load model once and cache in module-level variable."""
    global _model, _model_load_attempted

    if _model_load_attempted:
        return _model

    _model_load_attempted = True

    # Locate the .h5 file
    base_dir = Path(settings.BASE_DIR)
    candidate_paths = [
        base_dir / 'model' / 'toxicity_image' / 'best_toxic_model.h5',
        base_dir / 'best_toxic_model.h5',
    ]

    model_path = None
    for p in candidate_paths:
        if p.exists():
            model_path = p
            break

    if model_path is None:
        logger.warning(
            "Image toxicity model not found. Checked: %s",
            [str(p) for p in candidate_paths]
        )
        return None

    try:
        # Import TensorFlow only when needed so the app starts without it
        import tensorflow as tf
        _model = tf.keras.models.load_model(str(model_path))
        logger.info("Image toxicity model loaded from %s", model_path)
    except Exception as exc:
        logger.error("Failed to load image toxicity model: %s", exc)
        _model = None

    return _model


# ------------------------------------------------------------------ #
#  Public API                                                          #
# ------------------------------------------------------------------ #

def analyse_image(image_file) -> dict:
    """
    Run toxicity inference on an image file-like object.

    Args:
        image_file: A Django InMemoryUploadedFile / file-like object.

    Returns:
        {
            "is_toxic": bool,
            "confidence_score": float,   # probability of the predicted class
            "toxic_probability": float,  # P(toxic)
            "non_toxic_probability": float,
            "model_available": bool,
        }
    """
    model = _get_model()

    if model is None:
        return {
            "is_toxic": False,
            "confidence_score": 0.0,
            "toxic_probability": 0.0,
            "non_toxic_probability": 1.0,
            "model_available": False,
        }

    try:
        import tensorflow as tf
        from PIL import Image

        # Read image bytes and convert to RGB
        image_bytes = image_file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img = img.resize(IMG_SIZE)

        # Normalise to [0, 1] — same as training rescale=1./255
        img_array = np.array(img, dtype=np.float32) / 255.0
        img_array = np.expand_dims(img_array, axis=0)  # shape: (1, 224, 224, 3)

        # Inference
        prediction = model.predict(img_array, verbose=0)
        toxic_prob = float(prediction[0][0])  # sigmoid output
        non_toxic_prob = 1.0 - toxic_prob

        is_toxic = toxic_prob >= TOXIC_THRESHOLD
        confidence = toxic_prob if is_toxic else non_toxic_prob

        return {
            "is_toxic": is_toxic,
            "confidence_score": round(confidence, 4),
            "toxic_probability": round(toxic_prob, 4),
            "non_toxic_probability": round(non_toxic_prob, 4),
            "model_available": True,
        }

    except Exception as exc:
        logger.error("Image toxicity inference failed: %s", exc)
        return {
            "is_toxic": False,
            "confidence_score": 0.0,
            "toxic_probability": 0.0,
            "non_toxic_probability": 1.0,
            "model_available": False,
        }


def analyse_image_from_path(image_path: str) -> dict:
    """
    Convenience wrapper — accepts a filesystem path string.
    Useful for post-upload hooks.
    """
    with open(image_path, 'rb') as f:
        return analyse_image(f)