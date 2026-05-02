from django.db import models

# Create your models here.
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


class UserBehaviorProfile(models.Model):
    """
    Mirrors ToxicBehaviorEnforcer's per-user profile from training code.
    Stored in DB so it persists across requests.

    Threshold escalation (matches training exactly):
        OFFENSE_MULTIPLIER = {0:1.0, 1:1.3, 2:1.8, 3:2.5, 4+:4.0}
        effective_threshold = base_threshold / multiplier
        If avg_severity_score > 0.8: threshold *= 0.7
        Floor at 0.10
    """

    BASE_THRESHOLD = 0.5

    OFFENSE_MULTIPLIER = {0: 1.0, 1: 1.3, 2: 1.8, 3: 2.5}
    HIGH_OFFENSE_MULTIPLIER = 4.0

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='behavior_profile'
    )

    toxic_count   = models.PositiveIntegerField(default=0)
    warning_count = models.PositiveIntegerField(default=0)   # capped at 10
    blocked_count = models.PositiveIntegerField(default=0)
    severity_score = models.FloatField(default=0.0)          # rolling avg

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
        ordering = ['-toxic_count']

    def get_effective_threshold(self) -> float:
        offense_key = min(self.toxic_count, max(self.OFFENSE_MULTIPLIER.keys()))
        if self.toxic_count >= 4:
            multiplier = self.HIGH_OFFENSE_MULTIPLIER
        else:
            multiplier = self.OFFENSE_MULTIPLIER.get(offense_key, 1.0)
        threshold = self.BASE_THRESHOLD / multiplier
        if self.severity_score > 0.8:
            threshold *= 0.7
        return max(threshold, 0.10)

    def record_offence(self, severity: float, was_blocked: bool):
        now = timezone.now()
        self.toxic_count  += 1
        self.warning_count = min(self.warning_count + 1, 10)
        if was_blocked:
            self.blocked_count += 1
        self.severity_score = (self.severity_score + severity) / 2
        if not self.first_offence_at:
            self.first_offence_at = now
        self.last_offence_at = now

        if self.toxic_count >= 5:
            self.warning_level = WarningLevel.SEVERE
        elif self.toxic_count >= 3:
            self.warning_level = WarningLevel.MODERATE
        elif self.toxic_count >= 1:
            self.warning_level = WarningLevel.MILD

        if self.warning_level == WarningLevel.SEVERE and self.severity_score > 0.75:
            self.is_suspended = True
            self.suspended_until = now + timezone.timedelta(days=1)
            self.suspension_reason = (
                f"Auto-suspended: {self.toxic_count} toxic submissions, "
                f"avg severity {self.severity_score:.0%}"
            )
        self.save()

    def is_currently_suspended(self) -> bool:
        if not self.is_suspended:
            return False
        if self.suspended_until and timezone.now() > self.suspended_until:
            self.is_suspended = False
            self.suspended_until = None
            self.save(update_fields=['is_suspended', 'suspended_until'])
            return False
        return True

    def __str__(self):
        return f"BehaviorProfile({self.user}) toxic={self.toxic_count} level={self.warning_level}"


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

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['event_type', '-created_at']),
            models.Index(fields=['content_type', '-created_at']),
        ]

    def __str__(self):
        return f"BehaviorEvent [{self.event_type.upper()}] user={self.user_id} score={self.toxicity_score:.2f}"
