"""
toxicity_behavior.services
~~~~~~~~~~~~~~~~~~~~~~~~~~
Profile-based enforcement service.

This module is the Django equivalent of ToxicBehaviorEnforcer from the
training notebook.  Instead of an in-memory defaultdict it reads/writes
UserBehaviorProfile rows so state survives across processes and restarts.

Public API
----------
enforce_behavior(user, text, result, post=None, comment=None, content_type='post')
    Call AFTER toxicity_detection.services.analyse_toxicity() returns.
    Returns an enforcement dict — callers use it to decide whether to block.

get_user_status(user)
    Returns a summary dict for the API response.
"""

import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

# Category weights — must match training code exactly
CATEGORY_WEIGHTS = {
    'toxic':         1.0,
    'severe_toxic':  2.0,
    'obscene':       1.2,
    'threat':        3.0,
    'insult':        1.0,
    'identity_hate': 2.5,
}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _calculate_severity(label_scores: dict) -> float:
    """Weighted severity across all toxicity labels (matches training code)."""
    if not label_scores:
        return 0.0
    total_weight = sum(CATEGORY_WEIGHTS.get(k, 1.0) for k in CATEGORY_WEIGHTS)
    weighted_sum = sum(
        label_scores.get(k, 0.0) * CATEGORY_WEIGHTS.get(k, 1.0)
        for k in CATEGORY_WEIGHTS
    )
    return weighted_sum / total_weight if total_weight > 0 else 0.0


def _get_or_create_profile(user):
    from .models import UserBehaviorProfile
    profile, _ = UserBehaviorProfile.objects.get_or_create(user=user)
    return profile


# ---------------------------------------------------------------------------
# Main enforcement function
# ---------------------------------------------------------------------------

def enforce_behavior(
    user,
    text: str,
    toxicity_result: dict,
    post=None,
    comment=None,
    content_type: str = 'post',
) -> dict:
    """
    Apply profile-based enforcement on top of a raw toxicity_result.

    Parameters
    ----------
    user              : Django User instance
    text              : The original text that was analysed
    toxicity_result   : dict returned by toxicity_detection.services.analyse_toxicity()
    post / comment    : FK objects for the audit log
    content_type      : 'post' | 'comment'

    Returns
    -------
    {
        'is_blocked'       : bool,   # True → caller should reject the content
        'event_type'       : str,    # 'allowed' | 'warned' | 'blocked' | 'suspended'
        'threshold_used'   : float,
        'toxicity_score'   : float,
        'severity'         : float,
        'user_status'      : { toxic_count, warning_level, is_suspended, effective_threshold },
        'message'          : str,    # human-readable reason (for API response)
    }
    """
    from .models import BehaviorEvent

    label_scores    = toxicity_result.get('labels', {})
    toxicity_score  = toxicity_result.get('max_score', 0.0)
    flagged_labels  = toxicity_result.get('flagged_labels', [])

    profile = _get_or_create_profile(user)

    # --- 1. Check suspension first ---
    if profile.is_currently_suspended():
        _log_event(
            user=user, content_type=content_type,
            post=post, comment=comment,
            text=text, toxicity_score=toxicity_score,
            severity=_calculate_severity(label_scores),
            threshold=profile.get_effective_threshold(),
            category_scores=label_scores, flagged_labels=flagged_labels,
            event_type='suspended',
            profile=profile,
        )
        return _result(
            is_blocked=True,
            event_type='suspended',
            threshold=profile.get_effective_threshold(),
            toxicity_score=toxicity_score,
            severity=_calculate_severity(label_scores),
            profile=profile,
            message=(
                f"Your account is suspended until "
                f"{profile.suspended_until.strftime('%Y-%m-%d %H:%M UTC')} "
                f"due to repeated toxic behaviour."
            ),
        )

    # --- 2. Get dynamic threshold ---
    threshold = profile.get_effective_threshold()
    severity  = _calculate_severity(label_scores)

    # --- 3. Apply threshold (instead of simple 0.5 from base service) ---
    is_toxic_for_user = toxicity_score > threshold

    if not is_toxic_for_user:
        # Content passes for this user's current threshold
        _log_event(
            user=user, content_type=content_type,
            post=post, comment=comment,
            text=text, toxicity_score=toxicity_score,
            severity=severity, threshold=threshold,
            category_scores=label_scores, flagged_labels=flagged_labels,
            event_type='allowed', profile=profile,
        )
        return _result(
            is_blocked=False, event_type='allowed',
            threshold=threshold, toxicity_score=toxicity_score,
            severity=severity, profile=profile,
            message='Content approved.',
        )

    # --- 4. Content is toxic for this user → record offence ---
    was_blocked = True   # we always block when toxic_for_user
    profile.record_offence(severity=severity, was_blocked=was_blocked)

    # Determine event type for the log
    if profile.is_suspended:
        event_type = 'suspended'
        message = (
            f"Your account has been suspended for 24 hours due to repeated "
            f"toxic behaviour ({profile.toxic_count} violations)."
        )
    else:
        event_type = 'blocked'
        message = (
            f"Your content was flagged as inappropriate and could not be posted. "
            f"Violation #{profile.toxic_count}. "
            f"Repeated violations will result in account suspension."
        )

    _log_event(
        user=user, content_type=content_type,
        post=post, comment=comment,
        text=text, toxicity_score=toxicity_score,
        severity=severity, threshold=threshold,
        category_scores=label_scores, flagged_labels=flagged_labels,
        event_type=event_type, profile=profile,
    )

    return _result(
        is_blocked=True, event_type=event_type,
        threshold=threshold, toxicity_score=toxicity_score,
        severity=severity, profile=profile, message=message,
    )


# ---------------------------------------------------------------------------
# Status helper (for API responses)
# ---------------------------------------------------------------------------

def get_user_status(user) -> dict:
    profile = _get_or_create_profile(user)
    return {
        'toxic_count':        profile.toxic_count,
        'warning_level':      profile.warning_level,
        'is_suspended':       profile.is_currently_suspended(),
        'suspended_until':    profile.suspended_until,
        'effective_threshold': profile.get_effective_threshold(),
        'severity_score':     profile.severity_score,
        'blocked_count':      profile.blocked_count,
    }


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _result(is_blocked, event_type, threshold, toxicity_score, severity, profile, message):
    return {
        'is_blocked':     is_blocked,
        'event_type':     event_type,
        'threshold_used': threshold,
        'toxicity_score': toxicity_score,
        'severity':       severity,
        'message':        message,
        'user_status': {
            'toxic_count':         profile.toxic_count,
            'warning_level':       profile.warning_level,
            'is_suspended':        profile.is_suspended,
            'effective_threshold': profile.get_effective_threshold(),
        },
    }


def _log_event(
    user, content_type, post, comment, text,
    toxicity_score, severity, threshold,
    category_scores, flagged_labels, event_type, profile,
):
    try:
        from .models import BehaviorEvent
        BehaviorEvent.objects.create(
            user=user,
            content_type=content_type,
            post=post,
            comment=comment,
            analysed_text=text[:500],
            toxicity_score=toxicity_score,
            severity=severity,
            threshold_used=threshold,
            category_scores=category_scores,
            flagged_labels=flagged_labels,
            event_type=event_type,
            toxic_count_at_event=profile.toxic_count,
            warning_level_at_event=profile.warning_level,
        )
    except Exception as exc:
        logger.error(f"BehaviorEvent log failed: {exc}")
