from django.db import models
from django.conf import settings
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class WarningLevel(models.TextChoices):
    NONE     = 'none',      'No Warning'
    MILD     = 'mild',      'Mild (1-2 offences)'
    MODERATE = 'moderate',  'Moderate (3-4 offences)'
    SEVERE   = 'severe',    'Severe (5+ offences)'
    BANNED   = 'banned',    'Banned'


class BehaviorPattern(models.TextChoices):
    """Psychological behavior patterns"""
    ONE_OFF = 'one_off', 'Single Offence'
    CHRONIC_LOW = 'chronic_low', 'Many Low Severity'
    ESCALATING = 'escalating', 'Increasing Severity'
    MALICIOUS = 'malicious', 'Few High Severity'
    RECOVERING = 'recovering', 'Improving'
    IMPULSIVE = 'impulsive', 'High Frequency Low Severity'


class UserBehaviorProfile(models.Model):
    """
    Mirrors ToxicBehaviorEnforcer's per-user profile from training code.
    Stored in DB so it persists across requests.
    """

    BASE_THRESHOLD = 0.5

    OFFENSE_MULTIPLIER = {0: 1.0, 1: 1.3, 2: 1.8, 3: 2.5}
    HIGH_OFFENSE_MULTIPLIER = 4.0

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='behavior_profile'
    )

    # Basic counters
    toxic_count   = models.PositiveIntegerField(default=0)
    warning_count = models.PositiveIntegerField(default=0)
    blocked_count = models.PositiveIntegerField(default=0)
    severity_score = models.FloatField(default=0.0)

    # Psychological metrics (NEW)
    psychological_risk_score = models.FloatField(default=0.0)  # 0-1 overall risk
    psychological_pattern = models.CharField(
        max_length=20, choices=BehaviorPattern.choices, default=BehaviorPattern.ONE_OFF
    )
    
    # Multi-dimensional scores (NEW)
    impulsivity_score = models.FloatField(default=0.0)    # High count, low severity
    malice_score = models.FloatField(default=0.0)         # High severity, low count
    escalation_risk = models.FloatField(default=0.0)      # Increasing trend
    recovery_score = models.FloatField(default=0.0)       # Decreasing trend
    
    # Weighted historical data for psychological analysis (NEW)
    weighted_toxicity_score = models.FloatField(default=0.0)  # Recency-weighted
    severity_weighted_offenses = models.FloatField(default=0.0)  # Severity-weighted count

    warning_level = models.CharField(
        max_length=10, choices=WarningLevel.choices, default=WarningLevel.NONE
    )
    is_suspended      = models.BooleanField(default=False)
    suspended_until   = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(blank=True, null=True)

    first_offence_at = models.DateTimeField(null=True, blank=True)
    last_offence_at  = models.DateTimeField(null=True, blank=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-psychological_risk_score', '-toxic_count']

    def _sync_user_account_status(self):
        """Synchronize suspension status with CustomUser model"""
        try:
            if self.is_suspended and self.suspended_until and self.suspended_until > timezone.now():
                if self.user.account_status != 'suspended':
                    self.user.account_status = 'suspended'
                    self.user.suspended_until = self.suspended_until
                    self.user.suspension_reason = self.suspension_reason
                    self.user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])
                    
                    try:
                        from knox.models import AuthToken
                        AuthToken.objects.filter(user=self.user).delete()
                    except ImportError:
                        pass
            else:
                if self.user.account_status == 'suspended':
                    self.user.account_status = 'active'
                    self.user.suspended_until = None
                    self.user.suspension_reason = None
                    self.user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to sync user status: {e}")

    def get_effective_threshold(self) -> float:
        """Calculate dynamic threshold based on psychological profile"""
        
        # Base threshold calculation
        if self.toxic_count >= 4:
            multiplier = self.HIGH_OFFENSE_MULTIPLIER
        else:
            multiplier = self.OFFENSE_MULTIPLIER.get(self.toxic_count, 1.0)
        
        threshold = self.BASE_THRESHOLD / multiplier
        
        # Apply psychological adjustments (NEW)
        # Recovering users get easier threshold
        if self.psychological_pattern == BehaviorPattern.RECOVERING and self.recovery_score > 0.6:
            threshold *= 1.5  # Easier to pass
        
        # Malicious users get harder threshold
        elif self.psychological_pattern == BehaviorPattern.MALICIOUS and self.malice_score > 0.7:
            threshold *= 0.5  # Much harder to pass
        
        # Escalating users get increasingly harder
        elif self.psychological_pattern == BehaviorPattern.ESCALATING:
            escalation_penalty = max(0.3, 1.0 - self.escalation_risk)
            threshold *= escalation_penalty
        
        # Impulsive users get moderate adjustment
        elif self.psychological_pattern == BehaviorPattern.IMPULSIVE:
            threshold *= 0.8
        
        # Apply severity-based reduction
        if self.severity_score > 0.8:
            threshold *= 0.3
        elif self.severity_score > 0.7:
            threshold *= 0.4
        elif self.severity_score > 0.6:
            threshold *= 0.5
        elif self.severity_score > 0.5:
            threshold *= 0.6
        elif self.severity_score > 0.35:
            threshold *= 0.75
        
        # Additional penalty for high offense counts
        if self.toxic_count > 5:
            extra_penalty = 1.0 - (min(self.toxic_count - 5, 15) * 0.04)
            threshold *= max(extra_penalty, 0.3)
        
        # Ensure threshold is low enough to catch repeat offenders
        if self.toxic_count >= 5 and self.severity_score > 0.5:
            threshold = min(threshold, 0.15)
        
        return max(threshold, 0.05)

    def _calculate_psychological_metrics(self, event_severity: float):
        """
        Calculate all psychological metrics based on event history.
        This is the core psychological model.
        """
        from .models import BehaviorEvent
        
        # Get all events for this user
        events = BehaviorEvent.objects.filter(user=self.user).order_by('created_at')
        event_list = list(events)
        
        if not event_list:
            self.psychological_risk_score = 0.0
            self.psychological_pattern = BehaviorPattern.ONE_OFF
            return
        
        # 1. Calculate severity-weighted offenses (malice score)
        #    High severity events count more than low severity
        total_severity_weight = 0.0
        for ev in event_list:
            if ev.severity > 0.7:
                total_severity_weight += ev.severity * 1.5
            else:
                total_severity_weight += ev.severity
        self.severity_weighted_offenses = round(total_severity_weight, 4)
        
        # 2. Calculate malice score: High severity, low count
        if len(event_list) <= 3 and max(e.severity for e in event_list) > 0.7:
            # Bothered about few high-severity events
            self.malice_score = min(0.95, max(e.severity for e in event_list))
        else:
            # Normalized severity-weighted average
            avg_severity = sum(e.severity for e in event_list) / len(event_list)
            self.malice_score = min(0.8, avg_severity * 1.2)
        
        # 3. Calculate impulsivity score: Many low-severity events
        low_severity_count = sum(1 for e in event_list if e.severity < 0.4)
        if len(event_list) >= 5 and low_severity_count / len(event_list) > 0.6:
            # Mostly low severity, many events
            self.impulsivity_score = min(0.9, len(event_list) / 20)
        else:
            self.impulsivity_score = 0.0
        
        # 4. Calculate recency-weighted toxicity (weighted_toxicity_score)
        #    Older events decay exponentially
        now = timezone.now()
        total_weighted = 0.0
        total_weight = 0.0
        
        for ev in event_list:
            days_ago = max(0, (now - ev.created_at).days)
            # Exponential decay: half-life = 7 days
            decay = 0.5 ** (days_ago / 7.0)
            total_weighted += ev.severity * decay
            total_weight += decay
        
        if total_weight > 0:
            self.weighted_toxicity_score = round(total_weighted / total_weight, 4)
        else:
            self.weighted_toxicity_score = 0.0
        
        # 5. Calculate escalation risk (increasing severity trend)
        if len(event_list) >= 3:
            # Compare first third vs last third
            third_len = max(1, len(event_list) // 3)
            first_third = [e.severity for e in event_list[:third_len]]
            last_third = [e.severity for e in event_list[-third_len:]]
            
            if first_third and last_third:
                first_avg = sum(first_third) / len(first_third)
                last_avg = sum(last_third) / len(last_third)
                
                if last_avg > first_avg:
                    self.escalation_risk = min(0.95, (last_avg - first_avg) / max(first_avg, 0.1))
                else:
                    self.escalation_risk = 0.0
        else:
            self.escalation_risk = 0.0
        
        # 6. Calculate recovery score (decreasing severity trend)
        if len(event_list) >= 3:
            third_len = max(1, len(event_list) // 3)
            first_third = [e.severity for e in event_list[:third_len]]
            last_third = [e.severity for e in event_list[-third_len:]]
            
            if first_third and last_third:
                first_avg = sum(first_third) / len(first_third)
                last_avg = sum(last_third) / len(last_third)
                
                if first_avg > last_avg:
                    self.recovery_score = min(0.9, (first_avg - last_avg) / max(last_avg, 0.1))
                else:
                    self.recovery_score = 0.0
        else:
            self.recovery_score = 0.0
        
        # 7. Determine psychological pattern
        # Priority order (most severe patterns first)
        
        # Malicious: Few high-severity events
        if len(event_list) <= 3 and max(e.severity for e in event_list) > 0.8:
            self.psychological_pattern = BehaviorPattern.MALICIOUS
        
        # Escalating: Severity increasing over time
        elif self.escalation_risk > 0.4 and len(event_list) >= 3:
            self.psychological_pattern = BehaviorPattern.ESCALATING
        
        # Recovering: Severity decreasing over time
        elif self.recovery_score > 0.4 and len(event_list) >= 3:
            self.psychological_pattern = BehaviorPattern.RECOVERING
        
        # Impulsive: Many events, mostly low severity
        elif len(event_list) >= 5 and self.impulsivity_score > 0.5:
            self.psychological_pattern = BehaviorPattern.IMPULSIVE
        
        # Chronic low: Many events, moderate but not high severity
        elif len(event_list) >= 5 and self.severity_score < 0.6:
            self.psychological_pattern = BehaviorPattern.CHRONIC_LOW
        
        # Single or few events
        elif len(event_list) <= 2:
            self.psychological_pattern = BehaviorPattern.ONE_OFF
        
        else:
            self.psychological_pattern = BehaviorPattern.ONE_OFF
        
        # 8. Calculate overall psychological risk score (0-1)
        risk_components = []
        
        # Add malice (30% weight for severe cases)
        risk_components.append(self.malice_score * 0.3)
        
        # Add escalation risk (25% weight)
        risk_components.append(self.escalation_risk * 0.25)
        
        # Add severity-weighted offenses normalized (20% weight)
        normalized_weighted = min(1.0, self.severity_weighted_offenses / 10.0)
        risk_components.append(normalized_weighted * 0.2)
        
        # Add impulsivity (but lower weight for impulsive - education needed)
        risk_components.append(self.impulsivity_score * 0.1)
        
        # Add recency-weighted toxicity (15% weight)
        risk_components.append(self.weighted_toxicity_score * 0.15)
        
        # Special adjustments based on pattern
        if self.psychological_pattern == BehaviorPattern.MALICIOUS:
            self.psychological_risk_score = min(0.95, sum(risk_components) + 0.2)
        elif self.psychological_pattern == BehaviorPattern.ESCALATING:
            self.psychological_risk_score = min(0.9, sum(risk_components) + 0.15)
        elif self.psychological_pattern == BehaviorPattern.RECOVERING:
            self.psychological_risk_score = max(0.2, sum(risk_components) - 0.2)
        elif self.psychological_pattern == BehaviorPattern.CHRONIC_LOW:
            self.psychological_risk_score = min(0.6, sum(risk_components))
        elif self.psychological_pattern == BehaviorPattern.IMPULSIVE:
            self.psychological_risk_score = min(0.5, sum(risk_components))
        else:
            self.psychological_risk_score = min(0.8, sum(risk_components))
        
        # Ensure within bounds
        self.psychological_risk_score = max(0.0, min(1.0, self.psychological_risk_score))

    def _get_psychological_recommendation(self) -> dict:
        """Get recommended action based on psychological profile"""
        
        # Based on psychological risk score
        if self.psychological_risk_score > 0.9:
            return {
                'action': 'ban_review',
                'days': 0,
                'reason': f'Extreme psychological risk ({self.psychological_risk_score:.0%}). Immediate admin review required.',
                'priority': 'critical'
            }
        elif self.psychological_risk_score > 0.75:
            return {
                'action': 'suspend',
                'days': 7,
                'reason': f'High psychological risk ({self.psychological_risk_score:.0%}) - Malicious pattern detected.',
                'priority': 'high'
            }
        elif self.psychological_risk_score > 0.6:
            return {
                'action': 'suspend',
                'days': 3,
                'reason': f'Moderate-high psychological risk ({self.psychological_risk_score:.0%}) - Intervention needed.',
                'priority': 'medium'
            }
        elif self.psychological_risk_score > 0.45:
            return {
                'action': 'warn_suspend',
                'days': 1,
                'reason': f'Warning pattern: {self.get_psychological_pattern_display()} - Temporary cool-down recommended.',
                'priority': 'low'
            }
        elif self.psychological_risk_score > 0.3:
            return {
                'action': 'warn',
                'days': 0,
                'reason': f'{self.get_psychological_pattern_display()} pattern detected. Educational intervention suggested.',
                'priority': 'monitor'
            }
        else:
            return {
                'action': 'none',
                'days': 0,
                'reason': f'Low risk ({self.psychological_risk_score:.0%}) - Normal behavior.',
                'priority': 'none'
            }

    def record_offence(self, severity: float, was_blocked: bool):
        """Record a new offense and update user's behavior profile with psychological metrics"""
        now = timezone.now()
        
        # Increment counters
        self.toxic_count += 1
        self.warning_count = min(self.warning_count + 1, 10)
        if was_blocked:
            self.blocked_count += 1
        
        # Update severity score with exponential moving average
        if self.toxic_count == 1:
            self.severity_score = severity
        elif self.toxic_count <= 3:
            self.severity_score = (self.severity_score * 0.6) + (severity * 0.4)
        elif self.toxic_count <= 6:
            self.severity_score = (self.severity_score * 0.5) + (severity * 0.5)
        else:
            self.severity_score = (self.severity_score * 0.35) + (severity * 0.65)
        
        # Ensure severity doesn't decrease artificially
        if severity > self.severity_score and self.toxic_count > 1:
            self.severity_score = min((self.severity_score + severity) / 1.4, 1.0)
        
        self.severity_score = min(self.severity_score, 1.0)
        
        # Set timestamps
        if not self.first_offence_at:
            self.first_offence_at = now
        self.last_offence_at = now
        
        # CRITICAL: Calculate psychological metrics
        # This must be done BEFORE updating warning level and suspension
        self._calculate_psychological_metrics(severity)
        
        # Get psychological recommendation
        psych_rec = self._get_psychological_recommendation()
        
        # Update warning level based on psychological risk (better than simple count)
        if self.psychological_risk_score > 0.8:
            self.warning_level = WarningLevel.BANNED
        elif self.psychological_risk_score > 0.6:
            self.warning_level = WarningLevel.SEVERE
        elif self.psychological_risk_score > 0.4:
            self.warning_level = WarningLevel.MODERATE
        elif self.psychological_risk_score > 0.2:
            self.warning_level = WarningLevel.MILD
        else:
            self.warning_level = WarningLevel.NONE
        
        # Determine suspension based on psychological recommendation
        should_suspend = False
        suspension_days = 0
        
        if psych_rec['action'] in ['suspend', 'warn_suspend', 'ban_review']:
            should_suspend = True
            suspension_days = psych_rec['days']
            
            # Additional override for severe patterns
            if self.psychological_pattern == BehaviorPattern.MALICIOUS and self.malice_score > 0.8:
                suspension_days = max(suspension_days, 14)
            elif self.psychological_pattern == BehaviorPattern.ESCALATING and self.escalation_risk > 0.7:
                suspension_days = max(suspension_days, 5)
            elif self.psychological_pattern == BehaviorPattern.IMPULSIVE:
                suspension_days = min(1, suspension_days)  # Shorter for impulsive
        
        if should_suspend:
            self.is_suspended = True
            self.suspended_until = now + timezone.timedelta(days=suspension_days)
            self.suspension_reason = (
                f"PSYCHOLOGICAL SUSPENSION: Pattern={self.get_psychological_pattern_display()}, "
                f"Risk={self.psychological_risk_score:.0%}, "
                f"Malice={self.malice_score:.0%}, "
                f"Escalation={self.escalation_risk:.0%}, "
                f"Count={self.toxic_count}, Severity={self.severity_score:.0%}. "
                f"{psych_rec['reason']}"
            )
        
        self.save()
        
        # Sync with CustomUser model
        self._sync_user_account_status()

    def record_clean_message(self):
        """
        Record a clean (non-toxic) message and let the profile recover.

        This is the missing counterpart to record_offence(). Without it,
        severity_score / psychological_risk_score could only ever go up
        (or stay flat) — a user who sent toxic messages and then switched
        to sending only clean messages would stay stuck at their worst
        score forever, because nothing ever told the profile "this user
        is behaving now".
        """
        if self.toxic_count == 0:
            # Nothing to recover from yet — keep everything at baseline.
            return

        now = timezone.now()
        previous_risk = self.psychological_risk_score

        # ── 1. Recalculate psychological metrics ─────────────────────
        #    Re-derives malice / escalation / recovery / pattern from the
        #    full event history (which now includes this clean message),
        #    so a sustained streak of clean messages is recognised as a
        #    "recovering" trend instead of being ignored. (Note: this can
        #    set psychological_risk_score itself, but for the RECOVERING
        #    pattern that formula has a hard floor of 0.2 — see step 3.)
        self._calculate_psychological_metrics(event_severity=0.0)

        # ── 2. Decay severity_score toward 0 ──────────────────────────
        #    Mirrors the EMA blending used in record_offence(), just
        #    pulling the score down instead of pushing it up.
        self.severity_score = round(self.severity_score * 0.85, 4)
        if self.severity_score < 0.01:
            self.severity_score = 0.0

        # ── 3. Decay risk relative to where it WAS, not the recompute ──
        #    Step 1's formula has a 0.2 floor once the pattern becomes
        #    "recovering", which would make risk plateau forever instead
        #    of continuing toward 0 on a long clean streak. Decaying from
        #    previous_risk (captured before step 1 ran) and taking the
        #    lower of the two values keeps it trending down — the same
        #    way record_offence() directly raises the score for a bad
        #    message instead of leaving it to indirect recomputation.
        decayed_risk = max(0.0, (previous_risk * 0.8) - 0.02)
        self.psychological_risk_score = round(
            min(self.psychological_risk_score, decayed_risk), 4
        )

        # ── 4. Ease the warning level off as risk drops ───────────────
        if self.psychological_risk_score > 0.8:
            self.warning_level = WarningLevel.BANNED
        elif self.psychological_risk_score > 0.6:
            self.warning_level = WarningLevel.SEVERE
        elif self.psychological_risk_score > 0.4:
            self.warning_level = WarningLevel.MODERATE
        elif self.psychological_risk_score > 0.2:
            self.warning_level = WarningLevel.MILD
        else:
            self.warning_level = WarningLevel.NONE

        self.updated_at = now
        self.save()

    def is_currently_suspended(self) -> bool:
        """Check if user is currently suspended (auto-expire)"""
        if not self.is_suspended:
            return False
        
        now = timezone.now()
        if self.suspended_until and now > self.suspended_until:
            # Suspension expired
            self.is_suspended = False
            self.suspended_until = None
            self.suspension_reason = None
            self.save(update_fields=['is_suspended', 'suspended_until', 'suspension_reason'])
            self._sync_user_account_status()
            return False
        
        return True

    def get_psychological_summary(self) -> dict:
        """Get human-readable psychological summary"""
        patterns = {
            BehaviorPattern.ONE_OFF: "Single isolated incident. Monitor but no action needed.",
            BehaviorPattern.CHRONIC_LOW: "Frequent low-severity issues. Likely impulsive or unaware. Educational approach recommended.",
            BehaviorPattern.ESCALATING: "⚠️ CRITICAL: User is ESCALATING! Severity increasing over time. Early intervention required!",
            BehaviorPattern.MALICIOUS: "🚨 DANGEROUS: Few but severe incidents. Intentional harmful behavior. Strong action required!",
            BehaviorPattern.RECOVERING: "✅ IMPROVING: User showing positive trend. Reward with relaxed monitoring.",
            BehaviorPattern.IMPULSIVE: "⚠️ Impulsive pattern: Many small offenses. Needs impulse control education."
        }
        
        return {
            'risk_score': round(self.psychological_risk_score, 3),
            'risk_level': 'HIGH' if self.psychological_risk_score > 0.6 else 'MEDIUM' if self.psychological_risk_score > 0.3 else 'LOW',
            'pattern': self.get_psychological_pattern_display(),
            'pattern_description': patterns.get(self.psychological_pattern, 'Unknown pattern'),
            'impulsivity_score': round(self.impulsivity_score, 3),
            'malice_score': round(self.malice_score, 3),
            'escalation_risk': round(self.escalation_risk, 3),
            'recovery_score': round(self.recovery_score, 3),
            'weighted_toxicity': round(self.weighted_toxicity_score, 3),
            'recommendation': self._get_psychological_recommendation(),
            'summary': f"User shows {self.get_psychological_pattern_display()} pattern. "
                      f"Risk score {self.psychological_risk_score:.0%}. "
                      f"{patterns.get(self.psychological_pattern, 'Monitor.')}"
        }

    def __str__(self):
        return f"BehaviorProfile({self.user}) toxic={self.toxic_count} pattern={self.get_psychological_pattern_display()} risk={self.psychological_risk_score:.0%}"


class BehaviorEvent(models.Model):
    """Audit log of every behaviour enforcement decision."""

    EVENT_TYPES = [
        ('allowed',   'Allowed'),
        ('warned',    'Warned'),
        ('blocked',   'Blocked'),
        ('suspended', 'Suspended'),
    ]
    CONTENT_TYPES = [
        ('post',    'Post'),
        ('comment', 'Comment'),
    ]

    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='behavior_events')
    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES)
    post    = models.ForeignKey('posts.Post',    on_delete=models.SET_NULL, null=True, blank=True, related_name='behavior_events')
    comment = models.ForeignKey('posts.Comment', on_delete=models.SET_NULL, null=True, blank=True, related_name='behavior_events')

    analysed_text  = models.TextField(max_length=500)
    toxicity_score = models.FloatField()
    severity       = models.FloatField()
    threshold_used = models.FloatField()
    category_scores = models.JSONField(default=dict)
    flagged_labels  = models.JSONField(default=list)

    event_type = models.CharField(max_length=10, choices=EVENT_TYPES)

    toxic_count_at_event   = models.PositiveIntegerField(default=0)
    warning_level_at_event = models.CharField(max_length=10, default='none')
    
    # Psychological metrics at time of event (NEW)
    psych_risk_at_event = models.FloatField(default=0.0)
    psych_pattern_at_event = models.CharField(max_length=20, default='one_off')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['event_type', '-created_at']),
            models.Index(fields=['content_type', '-created_at']),
            models.Index(fields=['psych_pattern_at_event', '-created_at']),  # For research
        ]

    def __str__(self):
        return f"BehaviorEvent [{self.event_type.upper()}] user={self.user_id} score={self.toxicity_score:.2f} pattern={self.psych_pattern_at_event}"