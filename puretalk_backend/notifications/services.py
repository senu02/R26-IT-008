"""
notifications.services
~~~~~~~~~~~~~~~~~~~~~~~
Small helper functions for creating notifications. Other apps (e.g.
toxicity_behavior) call these instead of touching the Notification
model directly, so the "who counts as admin" / "how do we batch this"
logic lives in one place.
"""

from .models import Notification, NotificationType


def notify_user(user, notification_type, title, message,
                 related_user=None, metadata=None):
    """Create a single notification for one specific user (the recipient)."""
    return Notification.objects.create(
        recipient=user,
        notification_type=notification_type,
        title=title,
        message=message,
        related_user=related_user,
        metadata=metadata or {},
    )


def notify_admins(notification_type, title, message,
                   related_user=None, metadata=None):
    """
    Create a notification for every admin/staff user.

    Uses `is_staff`, matching the admin check already used throughout
    toxicity_behavior/views.py (e.g. `if not request.user.is_staff`).
    """
    from django.contrib.auth import get_user_model
    User = get_user_model()

    admins = User.objects.filter(is_staff=True)
    notifications = [
        Notification(
            recipient=admin,
            notification_type=notification_type,
            title=title,
            message=message,
            related_user=related_user,
            metadata=metadata or {},
        )
        for admin in admins
    ]
    return Notification.objects.bulk_create(notifications)
