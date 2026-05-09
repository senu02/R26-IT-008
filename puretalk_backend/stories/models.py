import os

from django.conf import settings
from django.core.validators import FileExtensionValidator
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL


def story_image_path(instance, filename):
    ext = filename.split('.')[-1]
    safe = f"{timezone.now().strftime('%Y%m%d_%H%M%S')}_{instance.user_id}.{ext}"
    return os.path.join('stories', safe)


class Story(models.Model):
    """Ephemeral image story (24h window enforced in feed queries)."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='stories')
    image = models.ImageField(
        upload_to=story_image_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'webp', 'gif'],
            )
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f'Story {self.pk} by {self.user_id}'
