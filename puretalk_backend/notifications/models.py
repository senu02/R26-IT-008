from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class NotificationType(models.TextChoices):
    """What kind of event this notification is about."""
    # Content moderation (toxicity_behavior)
    WARNING        = 'warning',         'Content Warning'
    BLOCKED        = 'blocked',         'Content Blocked'
    SUSPENDED      = 'suspended',       'Account Suspended'
    ADMIN_ALERT    = 'admin_alert',     'Admin Alert'

    # Friends
    FRIEND_REQUEST  = 'friend_request',  'Friend Request'
    FRIEND_ACCEPTED = 'friend_accepted', 'Friend Request Accepted'

    # Posts
    POST_LIKE     = 'post_like',     'Post Liked'
    POST_COMMENT  = 'post_comment',  'New Comment'
    COMMENT_LIKE  = 'comment_like',  'Comment Liked'
    COMMENT_REPLY = 'comment_reply', 'Comment Reply'

    # Videos
    VIDEO_LIKE          = 'video_like',          'Video Liked'
    VIDEO_COMMENT       = 'video_comment',       'New Video Comment'
    VIDEO_COMMENT_LIKE  = 'video_comment_like',  'Video Comment Liked'
    VIDEO_COMMENT_REPLY = 'video_comment_reply', 'Video Comment Reply'

    # Reports → admin only
    CONTENT_REPORT = 'content_report', 'Content Reported'

    SYSTEM = 'system', 'System'


class Notification(models.Model):
    """
    A single in-app notification for one recipient.

    Used for two flows:
      1. User-facing: tell a user their own post/comment was warned,
         blocked, or that their account got suspended.
      2. Admin-facing: alert staff when a user becomes high-risk
         (e.g. gets suspended, or shows a malicious/escalating pattern)
         so they can review. `related_user` points at the user the
         alert is ABOUT, for admin notifications.
    """

    recipient = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM,
    )
    title   = models.CharField(max_length=200)
    message = models.TextField()

    # For admin alerts: which user is this notification ABOUT?
    related_user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='+',
    )

    # Free-form extra data (severity, risk score, pattern, etc.) so the
    # frontend can render richer cards without parsing the message text.
    metadata = models.JSONField(default=dict, blank=True)

    is_read    = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read', '-created_at']),
            models.Index(fields=['notification_type', '-created_at']),
        ]

    def __str__(self):
        return f"Notification({self.recipient}) [{self.notification_type}] {self.title}"
