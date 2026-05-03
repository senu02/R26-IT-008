from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class ToxicityLog(models.Model):
    """
    Stores every toxicity check result so admins can audit and review.
    Linked to either a Post or a Comment (only one will be set at a time).
    """

    CONTENT_TYPES = [
        ('post', 'Post'),
        ('comment', 'Comment'),
    ]

    # Generic link — only one of these will be non-null
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='toxicity_logs'
    )
    comment = models.ForeignKey(
        'posts.Comment',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='toxicity_logs'
    )

    content_type = models.CharField(max_length=10, choices=CONTENT_TYPES)
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='toxicity_logs'
    )

    # The exact text that was analysed
    analysed_text = models.TextField()

    # Raw scores
    is_toxic = models.BooleanField(default=False)
    max_score = models.FloatField(default=0.0)

    # Individual label scores stored as JSON
    label_scores = models.JSONField(default=dict)
    flagged_labels = models.JSONField(default=list)  # list of flagged label names

    # Admin override
    is_reviewed = models.BooleanField(default=False)
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_toxicity_logs'
    )
    review_notes = models.TextField(blank=True, null=True)
    overridden = models.BooleanField(default=False)  # admin overrode the AI decision

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_toxic', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['content_type', '-created_at']),
        ]

    def __str__(self):
        return (
            f"ToxicityLog [{self.content_type}] "
            f"is_toxic={self.is_toxic} score={self.max_score:.2f} "
            f"at {self.created_at}"
        )


class UserToxicityProfile(models.Model):
    """
    Running stats for each user — used to auto-escalate repeat offenders.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='toxicity_profile'
    )

    total_posts_checked = models.PositiveIntegerField(default=0)
    toxic_post_count = models.PositiveIntegerField(default=0)
    total_comments_checked = models.PositiveIntegerField(default=0)
    toxic_comment_count = models.PositiveIntegerField(default=0)

    # The highest score ever recorded for this user
    highest_toxicity_score = models.FloatField(default=0.0)

    is_flagged = models.BooleanField(default=False)   # manual admin flag
    is_suspended = models.BooleanField(default=False)  # auto-suspended

    last_toxic_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-toxic_post_count']

    @property
    def total_toxic_count(self):
        return self.toxic_post_count + self.toxic_comment_count

    @property
    def toxicity_rate(self):
        total = self.total_posts_checked + self.total_comments_checked
        if total == 0:
            return 0.0
        return self.total_toxic_count / total

    def __str__(self):
        return f"ToxicityProfile({self.user}) toxic={self.total_toxic_count}"