import os
import pickle
import numpy as np
from PIL import Image
import io

# ─── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT  = os.path.dirname(BASE_DIR)
MODEL_DIR     = os.path.join(PROJECT_ROOT, "model", "toxicity_image")
H5_MODEL_PATH = os.path.join(MODEL_DIR, "toxic_mobilenetv2_model.h5")
PKL_MODEL_PATH= os.path.join(MODEL_DIR, "toxic_model.pkl")

# MobileNetV2 standard input size
IMG_SIZE = (224, 224)

# Lazy singletons — loaded once on first request, reused forever
_h5_model  = None
_pkl_model = None


# ─── Model Loaders ────────────────────────────────────────────────────────────

def _load_h5_model():
    global _h5_model
    if _h5_model is None:
        from tensorflow import keras
        _h5_model = keras.models.load_model(H5_MODEL_PATH)
    return _h5_model


def _load_pkl_model():
    global _pkl_model
    if _pkl_model is None:
        with open(PKL_MODEL_PATH, "rb") as f:
            _pkl_model = pickle.load(f)
    return _pkl_model


# ─── Preprocessing ────────────────────────────────────────────────────────────

def _preprocess_image(image_file) -> np.ndarray:
    """
    Accepts:
      - Django InMemoryUploadedFile  (from request.FILES)
      - File path string
      - Raw bytes

    Returns numpy array of shape (1, 224, 224, 3) normalized to [0, 1].
    """
    if isinstance(image_file, (str, os.PathLike)):
        img = Image.open(image_file)
    elif isinstance(image_file, bytes):
        img = Image.open(io.BytesIO(image_file))
    else:
        # Django UploadedFile / InMemoryUploadedFile
        img = Image.open(image_file)

    img = img.convert("RGB")       # Strip alpha / grayscale
    img = img.resize(IMG_SIZE)     # Resize to 224x224

    arr = np.array(img, dtype=np.float32)
    arr = arr / 255.0              # Normalize [0, 1]
    arr = np.expand_dims(arr, 0)   # (1, 224, 224, 3)
    return arr


# ─── Public API ───────────────────────────────────────────────────────────────

def predict_toxic_image(
    image_file,
    model: str = "h5",
    threshold: float = 0.5
) -> dict:
    """
    Run toxicity inference on a single image.

    Args:
        image_file : Django UploadedFile | file path str | raw bytes
        model      : "h5"  → toxic_mobilenetv2_model.h5  (default)
                     "pkl" → toxic_model.pkl
        threshold  : Score >= threshold means TOXIC. Default 0.5.

    Returns dict:
        {
            "is_toxic"   : bool,
            "score"      : float,    # 0.0 (safe) → 1.0 (toxic)
            "label"      : str,      # "TOXIC" or "SAFE"
            "confidence" : float,    # percentage 0–100
            "model_used" : str,
        }
    """
    arr = _preprocess_image(image_file)

    loaded_model = _load_pkl_model() if model == "pkl" else _load_h5_model()
    raw_score    = float(loaded_model.predict(arr, verbose=0)[0][0])

    is_toxic   = raw_score >= threshold
    label      = "TOXIC" if is_toxic else "SAFE"
    confidence = raw_score * 100 if is_toxic else (1 - raw_score) * 100

    return {
        "is_toxic"   : is_toxic,
        "score"      : round(raw_score, 4),
        "label"      : label,
        "confidence" : round(confidence, 2),
        "model_used" : model,
    }
