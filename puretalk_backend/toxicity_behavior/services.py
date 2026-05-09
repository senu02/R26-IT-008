"""
toxicity_behavior.services
~~~~~~~~~~~~~~~~~~~~~~~~~~
Profile-based enforcement service with psychological metrics.
"""

import logging
from django.utils import timezone

logger = logging.getLogger(__name__)

CATEGORY_WEIGHTS = {
    'toxic': 1.0,
    'severe_toxic': 2.0,
    'obscene': 1.2,
    'threat': 3.0,
    'insult': 1.0,
    'identity_hate': 2.5,
}


def _calculate_severity(label_scores: dict) -> float:
    """Weighted severity across all toxicity labels."""
    if not label_scores:
        return 0.0
    
    total_weight = sum(CATEGORY_WEIGHTS.get(k, 1.0) for k in CATEGORY_WEIGHTS)
    weighted_sum = sum(
        label_scores.get(k, 0.0) * CATEGORY_WEIGHTS.get(k, 1.0)
        for k in CATEGORY_WEIGHTS
    )
    severity = weighted_sum / total_weight if total_weight > 0 else 0.0
    severity = min(severity, 1.0)
    
    # Boost severity if any label is very high
    if label_scores:
        max_label = max(label_scores.values())
        if max_label > 0.8 and severity < 0.6:
            severity = max(severity, max_label * 0.8)
    
    return severity


def _get_or_create_profile(user):
    from .models import UserBehaviorProfile
    profile, created = UserBehaviorProfile.objects.get_or_create(user=user)
    
    if created and user.account_status == 'suspended':
        if user.suspended_until and user.suspended_until > timezone.now():
            profile.is_suspended = True
            profile.suspended_until = user.suspended_until
            profile.suspension_reason = user.suspension_reason
            profile.save(update_fields=['is_suspended', 'suspended_until', 'suspension_reason'])
    
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
    Apply profile-based enforcement with psychological metrics.
    """
    from .models import BehaviorEvent

    label_scores = toxicity_result.get('labels', {})
    toxicity_score = toxicity_result.get('max_score', 0.0)
    flagged_labels = toxicity_result.get('flagged_labels', [])
    
    profile = _get_or_create_profile(user)
    severity = _calculate_severity(label_scores)
    
    # Get psychological summary for logging
    psych_summary = profile.get_psychological_summary() if profile.toxic_count > 0 else None
    
    logger.info(
        f"User {user.id} - Offense #{profile.toxic_count + 1}: "
        f"toxicity={toxicity_score:.3f}, severity={severity:.3f}, "
        f"psych_risk={profile.psychological_risk_score:.3f}, "
        f"pattern={profile.get_psychological_pattern_display()}"
    )

    # 1. Check suspension first
    if profile.is_currently_suspended():
        _log_event(
            user=user, content_type=content_type,
            post=post, comment=comment,
            text=text, toxicity_score=toxicity_score,
            severity=severity,
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
            severity=severity,
            profile=profile,
            message=(
                f"Your account is suspended until "
                f"{profile.suspended_until.strftime('%Y-%m-%d %H:%M UTC')}. "
                f"Reason: {profile.suspension_reason}"
            ),
        )

    # 2. Check if user is banned
    if user.account_status == 'banned':
        return _result(
            is_blocked=True,
            event_type='suspended',
            threshold=profile.get_effective_threshold(),
            toxicity_score=toxicity_score,
            severity=severity,
            profile=profile,
            message=f"Your account has been permanently banned.",
        )

    # 3. Get dynamic threshold (now influenced by psychological profile)
    threshold = profile.get_effective_threshold()
    
    # 4. Check if content is toxic for this user
    is_toxic_for_user = toxicity_score > threshold or severity > (threshold * 1.2)
    
    # Higher sensitivity for malicious/escalating users
    if profile.psychological_pattern in ['malicious', 'escalating'] and profile.psychological_risk_score > 0.5:
        if toxicity_score > threshold * 0.7:  # Stricter
            is_toxic_for_user = True
    
    # Lower sensitivity for recovering users
    elif profile.psychological_pattern == 'recovering' and profile.recovery_score > 0.5:
        if toxicity_score > threshold * 1.3:  # More lenient
            is_toxic_for_user = False
    
    if not is_toxic_for_user and label_scores:
        max_label = max(label_scores.values())
        if max_label > 0.75:
            is_toxic_for_user = True

    if not is_toxic_for_user:
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

    # 5. Content is toxic → record offence (this triggers psychological recalculation)
    was_blocked = True
    profile.record_offence(severity=severity, was_blocked=was_blocked)
    profile.refresh_from_db()
    
    # Get updated psychological summary
    psych_summary_after = profile.get_psychological_summary()

    # Determine event type and message
    if profile.is_suspended:
        event_type = 'suspended'
        message = (
            f"⚠️ PSYCHOLOGICAL SUSPENSION\n\n"
            f"Your behavior has been analyzed using our AI psychological model.\n"
            f"Pattern Detected: {psych_summary_after['pattern']}\n"
            f"Risk Score: {psych_summary_after['risk_score']:.0%}\n\n"
            f"{psych_summary_after['pattern_description']}\n\n"
            f"Suspension until: {profile.suspended_until.strftime('%Y-%m-%d %H:%M UTC')}\n"
            f"Reason: {profile.suspension_reason}"
        )
    else:
        event_type = 'blocked'
        psych_rec = profile._get_psychological_recommendation()
        message = (
            f"❌ Content blocked.\n\n"
            f"Psychological Analysis:\n"
            f"• Pattern: {psych_summary_after['pattern']}\n"
            f"• Risk Score: {psych_summary_after['risk_score']:.0%}\n"
            f"• Impulsivity: {profile.impulsivity_score:.0%}\n"
            f"• Malice: {profile.malice_score:.0%}\n\n"
            f"{psych_summary_after['pattern_description']}\n\n"
            f"Recommendation: {psych_rec['reason']}\n\n"
            f"Violation #{profile.toxic_count} | Severity: {profile.severity_score:.0%}"
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


def get_user_status(user) -> dict:
    """Get user's current behavior status with psychological metrics"""
    profile = _get_or_create_profile(user)
    psych_summary = profile.get_psychological_summary()
    
    return {
        'toxic_count': profile.toxic_count,
        'warning_level': profile.warning_level,
        'is_suspended': profile.is_currently_suspended(),
        'suspended_until': profile.suspended_until,
        'effective_threshold': profile.get_effective_threshold(),
        'severity_score': profile.severity_score,
        'blocked_count': profile.blocked_count,
        # Psychological metrics
        'psychological': {
            'risk_score': profile.psychological_risk_score,
            'risk_level': psych_summary['risk_level'],
            'pattern': psych_summary['pattern'],
            'pattern_description': psych_summary['pattern_description'],
            'impulsivity_score': profile.impulsivity_score,
            'malice_score': profile.malice_score,
            'escalation_risk': profile.escalation_risk,
            'recovery_score': profile.recovery_score,
        }
    }


def _result(is_blocked, event_type, threshold, toxicity_score, severity, profile, message):
    psych_summary = profile.get_psychological_summary()
    
    return {
        'is_blocked': is_blocked,
        'event_type': event_type,
        'threshold_used': threshold,
        'toxicity_score': toxicity_score,
        'severity': severity,
        'message': message,
        'user_status': {
            'toxic_count': profile.toxic_count,
            'warning_level': profile.warning_level,
            'is_suspended': profile.is_suspended,
            'effective_threshold': profile.get_effective_threshold(),
            'severity_score': profile.severity_score,
            'psychological_pattern': profile.get_psychological_pattern_display(),
            'psychological_risk': profile.psychological_risk_score,
        },
        'psychological_summary': psych_summary,
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
            # Psychological metrics at time of event
            psych_risk_at_event=profile.psychological_risk_score,
            psych_pattern_at_event=profile.psychological_pattern,
        )
    except Exception as exc:
        logger.error(f"BehaviorEvent log failed: {exc}")