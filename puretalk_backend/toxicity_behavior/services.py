"""
toxicity_behavior.services
~~~~~~~~~~~~~~~~~~~~~~~~~~
Profile-based enforcement service with ML model integration.

CHANGES (IT22169594):
  - Integrated trained Random Forest / XGBoost model via ml_predictor.py
  - ML model predicts risk level from behavioral features
  - SHAP/LIME explanations added to enforcement response
  - Psychological behavior type + suggestion added
  - Falls back to rule-based if model not loaded

IT22169594 | Manohara H U K R T | R26-IT-008
"""

import logging
from django.utils import timezone
from .ml_predictor import predict_risk_from_profile, is_model_available
from notifications.services import notify_user, notify_admins
from notifications.models import NotificationType

logger = logging.getLogger(__name__)

CATEGORY_WEIGHTS = {
    'toxic':         1.0,
    'severe_toxic':  2.0,
    'obscene':       1.2,
    'threat':        3.0,
    'insult':        1.0,
    'identity_hate': 2.5,
}


def _calculate_severity(label_scores: dict) -> float:
    """Weighted severity across all toxicity labels."""
    if not label_scores:
        return 0.0

    total_weight = sum(
        CATEGORY_WEIGHTS.get(k, 1.0) for k in CATEGORY_WEIGHTS
    )
    weighted_sum = sum(
        label_scores.get(k, 0.0) * CATEGORY_WEIGHTS.get(k, 1.0)
        for k in CATEGORY_WEIGHTS
    )
    severity = weighted_sum / total_weight if total_weight > 0 else 0.0
    severity = min(severity, 1.0)

    if label_scores:
        max_label = max(label_scores.values())
        if max_label > 0.8 and severity < 0.6:
            severity = max(severity, max_label * 0.8)

    return severity


def _get_or_create_profile(user):
    from .models import UserBehaviorProfile
    profile, created = UserBehaviorProfile.objects.get_or_create(
        user=user
    )

    if created and user.account_status == 'suspended':
        if (user.suspended_until
                and user.suspended_until > timezone.now()):
            profile.is_suspended      = True
            profile.suspended_until   = user.suspended_until
            profile.suspension_reason = user.suspension_reason
            profile.save(update_fields=[
                'is_suspended', 'suspended_until', 'suspension_reason'
            ])

    return profile


def enforce_behavior(
    user,
    text: str,
    toxicity_result: dict,
    post=None,
    comment=None,
    content_type: str = 'post',
) -> dict:
    """
    Apply profile-based enforcement with ML model integration.

    Flow:
      1. Check suspension / ban
      2. Check if content is toxic
      3. Record offence → update behavioral profile
      4. Run ML model → predict risk level + behavior type
      5. Return result with SHAP explanation + suggestion
    """
    from .models import BehaviorEvent

    label_scores    = toxicity_result.get('labels', {})
    toxicity_score  = toxicity_result.get('max_score', 0.0)
    flagged_labels  = toxicity_result.get('flagged_labels', [])

    profile  = _get_or_create_profile(user)
    severity = _calculate_severity(label_scores)

    psych_summary = (
        profile.get_psychological_summary()
        if profile.toxic_count > 0 else None
    )

    logger.info(
        f"User {user.id} — Offense #{profile.toxic_count + 1}: "
        f"toxicity={toxicity_score:.3f}, severity={severity:.3f}, "
        f"psych_risk={profile.psychological_risk_score:.3f}, "
        f"pattern={profile.get_psychological_pattern_display()}, "
        f"ml_model={'active' if is_model_available() else 'fallback'}"
    )

    # ── 1. Check suspension ────────────────────────────────
    if profile.is_currently_suspended():
        _log_event(
            user=user, content_type=content_type,
            post=post, comment=comment,
            text=text, toxicity_score=toxicity_score,
            severity=severity,
            threshold=profile.get_effective_threshold(),
            category_scores=label_scores,
            flagged_labels=flagged_labels,
            event_type='suspended',
            profile=profile,
        )
        return _result(
            is_blocked=True,
            event_type='suspended',
            threshold=profile.get_effective_threshold(),
            toxicity_score=toxicity_score,
            severity=severity,
            profile=profile,
            message=(
                f"Your account is suspended until "
                f"{profile.suspended_until.strftime('%Y-%m-%d %H:%M UTC')}."
                f" Reason: {profile.suspension_reason}"
            ),
            ml_result=None,
        )

    # ── 2. Check permanent ban ─────────────────────────────
    if user.account_status == 'banned':
        return _result(
            is_blocked=True,
            event_type='suspended',
            threshold=profile.get_effective_threshold(),
            toxicity_score=toxicity_score,
            severity=severity,
            profile=profile,
            message="Your account has been permanently banned.",
            ml_result=None,
        )

    # ── 3. Dynamic threshold ───────────────────────────────
    threshold = profile.get_effective_threshold()

    is_toxic_for_user = (
        toxicity_score > threshold
        or severity > (threshold * 1.2)
    )

    if (profile.psychological_pattern in ['malicious', 'escalating']
            and profile.psychological_risk_score > 0.5):
        if toxicity_score > threshold * 0.7:
            is_toxic_for_user = True

    elif (profile.psychological_pattern == 'recovering'
          and profile.recovery_score > 0.5):
        if toxicity_score <= threshold * 1.3:
            is_toxic_for_user = False

    if not is_toxic_for_user and label_scores:
        if max(label_scores.values()) > 0.75:
            is_toxic_for_user = True

    # ── 4. Content is clean ────────────────────────────────
    if not is_toxic_for_user:
        _log_event(
            user=user, content_type=content_type,
            post=post, comment=comment,
            text=text, toxicity_score=toxicity_score,
            severity=severity, threshold=threshold,
            category_scores=label_scores,
            flagged_labels=flagged_labels,
            event_type='allowed', profile=profile,
        )

        # Let the profile recover — this is what actually brings
        # severity_score / psychological_risk_score back down after a
        # clean message. Previously nothing called this, so the scores
        # only ever went up and then stayed frozen at their peak.
        profile.record_clean_message()
        profile.refresh_from_db()

        return _result(
            is_blocked=False, event_type='allowed',
            threshold=threshold, toxicity_score=toxicity_score,
            severity=severity, profile=profile,
            message='Content approved.',
            ml_result=None,
        )

    # ── 5. Content is toxic → record offence ──────────────
    profile.record_offence(severity=severity, was_blocked=True)
    profile.refresh_from_db()

    psych_summary_after = profile.get_psychological_summary()

    # ── 6. ML MODEL PREDICTION ────────────────────────────
    #    Predict risk level + behavior type + SHAP explanation
    ml_result = predict_risk_from_profile(profile)

    logger.info(
        f"ML Prediction — User {user.id}: "
        f"risk={ml_result['risk_level']}, "
        f"score={ml_result['risk_score']:.3f}, "
        f"behavior={ml_result['behavior_type']}, "
        f"model={ml_result['model_used']}"
    )

    # ── 7. Build enforcement message ───────────────────────
    if profile.is_suspended:
        event_type = 'suspended'
        message = (
            f"⚠️ SUSPENSION\n\n"
            f"AI Behavioral Analysis:\n"
            f"• Pattern     : {psych_summary_after['pattern']}\n"
            f"• Risk Level  : {ml_result['risk_level']} "
            f"({ml_result['risk_score']:.0%})\n"
            f"• Behavior    : {ml_result['behavior_type']}\n\n"
            f"{psych_summary_after['pattern_description']}\n\n"
            f"💡 Suggestion: {ml_result['suggestion']}\n\n"
            f"Suspended until: "
            f"{profile.suspended_until.strftime('%Y-%m-%d %H:%M UTC')}\n"
            f"Reason: {profile.suspension_reason}"
        )
    else:
        event_type = 'blocked'
        psych_rec  = profile._get_psychological_recommendation()
        message = (
            f"❌ Content blocked.\n\n"
            f"AI Behavioral Analysis:\n"
            f"• Pattern     : {psych_summary_after['pattern']}\n"
            f"• Risk Level  : {ml_result['risk_level']} "
            f"({ml_result['risk_score']:.0%})\n"
            f"• Behavior    : {ml_result['behavior_type']}\n"
            f"• Impulsivity : {profile.impulsivity_score:.0%}\n"
            f"• Malice      : {profile.malice_score:.0%}\n\n"
            f"{psych_summary_after['pattern_description']}\n\n"
            f"💡 Suggestion : {ml_result['suggestion']}\n"
            f"📋 Enforcement: {ml_result['enforcement']}\n\n"
            f"Recommendation: {psych_rec['reason']}\n"
            f"Violation #{profile.toxic_count} | "
            f"Severity: {profile.severity_score:.0%}"
        )

    _log_event(
        user=user, content_type=content_type,
        post=post, comment=comment,
        text=text, toxicity_score=toxicity_score,
        severity=severity, threshold=threshold,
        category_scores=label_scores,
        flagged_labels=flagged_labels,
        event_type=event_type, profile=profile,
    )

    # ── 8. Notify the user ──────────────────────────────────
    #    Previously this detailed message (pattern, risk %, suggestion)
    #    was built above and then thrown away — the user only ever saw
    #    a generic "flagged as inappropriate" error from posts/views.py.
    #    Now it's saved as a real notification they can check anytime.
    notify_user(
        user=user,
        notification_type=(
            NotificationType.SUSPENDED if profile.is_suspended
            else NotificationType.BLOCKED
        ),
        title=(
            "Your account has been suspended"
            if profile.is_suspended else "Your content was blocked"
        ),
        message=message,
        metadata={
            'severity': profile.severity_score,
            'psychological_risk': profile.psychological_risk_score,
            'pattern': profile.psychological_pattern,
            'toxic_count': profile.toxic_count,
        },
    )

    # ── 9. Alert admins on high-risk users ──────────────────
    #    Don't spam staff on every single warning — only when the user
    #    actually gets suspended, or shows a dangerous pattern with high
    #    confidence (malicious / escalating + risk above 0.6).
    is_high_risk_pattern = (
        profile.psychological_pattern in ('malicious', 'escalating')
        and profile.psychological_risk_score > 0.6
    )
    if profile.is_suspended or is_high_risk_pattern:
        notify_admins(
            notification_type=NotificationType.ADMIN_ALERT,
            title=f"⚠️ High-risk user: {user.email}",
            message=(
                f"Pattern: {psych_summary_after['pattern']} | "
                f"Risk: {profile.psychological_risk_score:.0%} | "
                f"Violations: {profile.toxic_count} | "
                f"Severity: {profile.severity_score:.0%}"
                + (
                    f"\nSuspended until: {profile.suspended_until.strftime('%Y-%m-%d %H:%M UTC')}"
                    if profile.is_suspended else ""
                )
            ),
            related_user=user,
            metadata={
                'pattern': profile.psychological_pattern,
                'risk_score': profile.psychological_risk_score,
                'toxic_count': profile.toxic_count,
                'severity': profile.severity_score,
                'is_suspended': profile.is_suspended,
            },
        )

    return _result(
        is_blocked=True, event_type=event_type,
        threshold=threshold, toxicity_score=toxicity_score,
        severity=severity, profile=profile,
        message=message,
        ml_result=ml_result,
    )


def get_user_status(user) -> dict:
    """Get user's current behavior status with ML analysis."""
    profile       = _get_or_create_profile(user)
    psych_summary = profile.get_psychological_summary()

    # Run ML prediction on current profile
    ml_result = predict_risk_from_profile(profile)

    return {
        'toxic_count':      profile.toxic_count,
        'warning_level':    profile.warning_level,
        'is_suspended':     profile.is_currently_suspended(),
        'suspended_until':  profile.suspended_until,
        'effective_threshold': profile.get_effective_threshold(),
        'severity_score':   profile.severity_score,
        'blocked_count':    profile.blocked_count,
        # Original psychological metrics
        'psychological': {
            'risk_score':       profile.psychological_risk_score,
            'risk_level':       psych_summary['risk_level'],
            'pattern':          psych_summary['pattern'],
            'pattern_description': psych_summary['pattern_description'],
            'impulsivity_score':profile.impulsivity_score,
            'malice_score':     profile.malice_score,
            'escalation_risk':  profile.escalation_risk,
            'recovery_score':   profile.recovery_score,
        },
        # NEW: ML model prediction
        'ml_analysis': {
            'risk_level':       ml_result['risk_level'],
            'risk_score':       ml_result['risk_score'],
            'behavior_type':    ml_result['behavior_type'],
            'enforcement':      ml_result['enforcement'],
            'suggestion':       ml_result['suggestion'],
            'model_used':       ml_result['model_used'],
            'ml_active':        ml_result['ml_used'],
            'shap_explanation': ml_result.get('shap_explanation'),
        },
    }


def _result(is_blocked, event_type, threshold,
            toxicity_score, severity, profile,
            message, ml_result=None):

    psych_summary = profile.get_psychological_summary()

    result = {
        'is_blocked':    is_blocked,
        'event_type':    event_type,
        'threshold_used': threshold,
        'toxicity_score': toxicity_score,
        'severity':       severity,
        'message':        message,
        'user_status': {
            'toxic_count':        profile.toxic_count,
            'warning_level':      profile.warning_level,
            'is_suspended':       profile.is_suspended,
            'effective_threshold':profile.get_effective_threshold(),
            'severity_score':     profile.severity_score,
            'psychological_pattern':
                profile.get_psychological_pattern_display(),
            'psychological_risk':  profile.psychological_risk_score,
        },
        'psychological_summary': psych_summary,
    }

    # Add ML result if available
    if ml_result:
        result['ml_analysis'] = {
            'risk_level':       ml_result['risk_level'],
            'risk_score':       ml_result['risk_score'],
            'behavior_type':    ml_result['behavior_type'],
            'enforcement':      ml_result['enforcement'],
            'suggestion':       ml_result['suggestion'],
            'model_used':       ml_result['model_used'],
            'ml_active':        ml_result['ml_used'],
            'shap_explanation': ml_result.get('shap_explanation'),
        }

    return result


def _log_event(
    user, content_type, post, comment, text,
    toxicity_score, severity, threshold,
    category_scores, flagged_labels,
    event_type, profile,
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
            psych_risk_at_event=profile.psychological_risk_score,
            psych_pattern_at_event=profile.psychological_pattern,
        )
    except Exception as exc:
        logger.error(f"BehaviorEvent log failed: {exc}")