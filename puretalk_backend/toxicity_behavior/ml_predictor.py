"""
ml_predictor.py
~~~~~~~~~~~~~~~
Loads the trained Random Forest / XGBoost model (.pkl)
and provides risk prediction + SHAP explanation.

Place your trained model files in:
  puretalk_backend/model/toxicity_behavior/
      RF_enforcement_model.pkl
      RF_label_encoder.pkl
  OR
      XGB_enforcement_model.pkl
      XGB_label_encoder.pkl

IT22169594 | Manohara H U K R T | R26-IT-008
"""

import os
import logging
import pickle
import numpy as np

logger = logging.getLogger(__name__)

# ── paths ──────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'model', 'toxicity_behavior')

# Try RF first, then XGBoost
_MODEL_FILES = [
    ('RF_enforcement_model.pkl',  'RF_label_encoder.pkl',  'Random Forest'),
    ('XGB_enforcement_model.pkl', 'XGB_label_encoder.pkl', 'XGBoost'),
]

# Feature names — must match training notebook
FEATURE_COLS = [
    'frequency',
    'severity',
    'recency',
    'escalation',
    'max_severity',
    'hate_score',
]

# ── load model once at startup ──────────────────────────────
_model     = None
_label_enc = None
_explainer = None
_model_name = None


def _load_model():
    global _model, _label_enc, _explainer, _model_name

    for model_file, enc_file, name in _MODEL_FILES:
        model_path = os.path.join(MODEL_DIR, model_file)
        enc_path   = os.path.join(MODEL_DIR, enc_file)

        if os.path.exists(model_path) and os.path.exists(enc_path):
            try:
                with open(model_path, 'rb') as f:
                    _model = pickle.load(f)
                with open(enc_path, 'rb') as f:
                    _label_enc = pickle.load(f)
                _model_name = name

                # Load SHAP explainer
                try:
                    import shap
                    _explainer = shap.TreeExplainer(_model)
                    logger.info(f"SHAP explainer loaded for {name}")
                except Exception as e:
                    logger.warning(f"SHAP not available: {e}")
                    _explainer = None

                logger.info(
                    f"✅ ML model loaded: {name} from {model_path}"
                )
                return True

            except Exception as e:
                logger.error(f"Failed to load {name}: {e}")

    logger.warning(
        "⚠️  No trained ML model found in "
        f"{MODEL_DIR}. "
        "Using rule-based fallback."
    )
    return False


# Load on import
_load_model()


# ── public API ─────────────────────────────────────────────

def is_model_available() -> bool:
    return _model is not None and _label_enc is not None


def predict_risk(
    frequency: int,
    severity: float,
    recency: float,
    escalation: float,
    max_severity: float,
    hate_score: float,
) -> dict:
    """
    Predict risk level using trained ML model.

    Returns:
        {
          'risk_level':   'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE',
          'risk_score':   float (0-1),
          'behavior_type': str,
          'enforcement':  str,
          'suggestion':   str,
          'shap_explanation': dict | None,
          'model_used':   str,
          'ml_used':      bool,
        }
    """
    if not is_model_available():
        # Fallback: rule-based
        return _rule_based_predict(
            frequency, severity, recency,
            escalation, max_severity, hate_score
        )

    try:
        features = np.array([[
            frequency, severity, recency,
            escalation, max_severity, hate_score
        ]])

        # Predict risk level
        pred       = _model.predict(features)[0]
        risk_label = _label_enc.inverse_transform([int(pred)])[0]

        # Predict probability for risk score
        try:
            proba      = _model.predict_proba(features)[0]
            risk_score = float(max(proba))
        except Exception:
            risk_score = _severity_to_score(severity)

        # Behavior type
        behavior_type = _get_behavior_type(
            frequency, severity, escalation,
            hate_score
        )

        # Enforcement action
        enforcement = _get_enforcement(risk_label)

        # Suggestion
        suggestion = _get_suggestion(behavior_type)

        # SHAP explanation
        shap_explanation = None
        if _explainer is not None:
            try:
                shap_explanation = _get_shap_explanation(
                    features, int(pred)
                )
            except Exception as e:
                logger.warning(f"SHAP explanation failed: {e}")

        return {
            'risk_level':       risk_label,
            'risk_score':       round(risk_score, 4),
            'behavior_type':    behavior_type,
            'enforcement':      enforcement,
            'suggestion':       suggestion,
            'shap_explanation': shap_explanation,
            'model_used':       _model_name,
            'ml_used':          True,
        }

    except Exception as e:
        logger.error(f"ML prediction failed: {e}. Using fallback.")
        return _rule_based_predict(
            frequency, severity, recency,
            escalation, max_severity, hate_score
        )


def predict_risk_from_profile(profile) -> dict:
    """
    Predict risk directly from a UserBehaviorProfile object.
    Extracts features from the profile and calls predict_risk().
    """
    from .models import BehaviorEvent

    events = BehaviorEvent.objects.filter(
        user=profile.user
    ).order_by('created_at')
    event_list = list(events)

    scores = [e.severity for e in event_list] if event_list else [0.0]
    scores_arr = np.array(scores)

    # Feature extraction
    frequency    = profile.toxic_count
    severity     = float(profile.severity_score)
    max_severity = float(max(scores_arr))

    # hate_score MUST match the training definition exactly:
    # mean of the 'threat' + 'identity_hate' category scores per
    # message (NOT profile.malice_score, which is a different,
    # severity-based psychological metric that ignores category
    # labels entirely — using it here causes train/serve skew).
    hate_vals = []
    for e in event_list:
        cs = e.category_scores or {}
        hate_vals.append(
            (cs.get('threat', 0.0) + cs.get('identity_hate', 0.0)) / 2.0
        )
    hate_score = float(np.mean(hate_vals)) if hate_vals else 0.0

    # Recency: recent severity minus early severity
    if len(scores) >= 6:
        recency = float(
            scores_arr[-3:].mean() - scores_arr[:3].mean()
        )
    else:
        recency = 0.0

    # Escalation rate
    if len(scores) > 1:
        escalation = float(
            np.polyfit(range(len(scores)), scores_arr, 1)[0]
        )
    else:
        escalation = float(profile.escalation_risk)

    return predict_risk(
        frequency    = frequency,
        severity     = severity,
        recency      = recency,
        escalation   = escalation,
        max_severity = max_severity,
        hate_score   = hate_score,
    )


# ── helpers ────────────────────────────────────────────────

def _get_behavior_type(frequency, severity,
                        escalation, hate_score) -> str:
    if hate_score > 0.4:
        return "Hate-Driven"
    elif escalation > 0.05:
        return "Impulsive"
    elif severity > 0.5 and frequency < 4:
        return "Arrogant"
    elif frequency >= 7:
        return "Hot-Tempered"
    elif frequency >= 4:
        return "Persistent Aggressor"
    else:
        return "Occasional"


def _get_enforcement(risk_level: str) -> str:
    return {
        "LOW":    "⚠️  WARNING — Notify user. First reminder.",
        "MEDIUM": "🔇 MUTE — Restrict posting for 24 hours.",
        "HIGH":   "⏸️  SUSPENSION — Account suspended for 7 days.",
        "SEVERE": "🚫 PERMANENT BAN — Account permanently removed.",
    }.get(risk_level, "Monitor user.")


def _get_suggestion(behavior_type: str) -> str:
    return {
        "Hot-Tempered":
            "😤 You seem hot-tempered. Take a break and review community guidelines.",
        "Arrogant":
            "🧠 Arrogant patterns detected. Please use respectful communication.",
        "Impulsive":
            "⚡ Impulsive behavior detected. Pause before replying.",
        "Persistent Aggressor":
            "🔁 Repeated aggression detected. Account under close monitoring.",
        "Hate-Driven":
            "🚨 Hate-based content detected. This is a serious violation.",
        "Occasional":
            "ℹ️  Minor violation noted. Please follow community standards.",
    }.get(behavior_type, "Please follow community guidelines.")


def _severity_to_score(severity: float) -> float:
    """Convert severity to a 0-1 risk score."""
    if severity < 0.10:   return 0.10
    elif severity < 0.25: return 0.35
    elif severity < 0.50: return 0.65
    else:                 return 0.90


def _get_shap_explanation(features: np.ndarray,
                           pred_class: int) -> dict:
    """Generate SHAP explanation for a single prediction."""
    sv = _explainer.shap_values(features)

    if isinstance(sv, list):
        sv_class = sv[pred_class][0]
    elif sv.ndim == 3:
        sv_class = sv[0, :, pred_class]
    else:
        sv_class = sv[0]

    explanation = {}
    for feat, val in zip(FEATURE_COLS, sv_class):
        explanation[feat] = {
            'shap_value': round(float(val), 6),
            'direction':  'increases_risk' if val > 0 else 'decreases_risk',
            'impact':     'HIGH' if abs(val) > 0.1
                          else 'MEDIUM' if abs(val) > 0.03
                          else 'LOW',
        }
    return explanation


def _rule_based_predict(frequency, severity, recency,
                          escalation, max_severity,
                          hate_score) -> dict:
    """Fallback when no ML model is available."""
    if severity < 0.10:   risk = "LOW"
    elif severity < 0.25: risk = "MEDIUM"
    elif severity < 0.50: risk = "HIGH"
    else:                 risk = "SEVERE"

    behavior_type = _get_behavior_type(
        frequency, severity, escalation, hate_score
    )

    return {
        'risk_level':       risk,
        'risk_score':       round(_severity_to_score(severity), 4),
        'behavior_type':    behavior_type,
        'enforcement':      _get_enforcement(risk),
        'suggestion':       _get_suggestion(behavior_type),
        'shap_explanation': None,
        'model_used':       'Rule-Based Fallback',
        'ml_used':          False,
    }