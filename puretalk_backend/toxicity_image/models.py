from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class ImageToxicityLog(models.Model):
    """
    Stores every image toxicity scan result.
    Can be linked to a Post image or a standalone image check.
    """

    CONTENT_TYPES = [
        ('post', 'Post Image'),
        ('profile', 'Profile Picture'),
        ('story', 'Story Image'),
        ('standalone', 'Standalone Check'),
    ]

    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='image_toxicity_logs'
    )

    # Optional link to a post
    post = models.ForeignKey(
        'posts.Post',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='image_toxicity_logs'
    )

    content_type = models.CharField(
        max_length=20,
        choices=CONTENT_TYPES,
        default='standalone'
    )

    # The image that was scanned (stored temporarily or permanently)
    image = models.ImageField(
        upload_to='toxicity_image_scans/',
        null=True,
        blank=True
    )

    # Model prediction result
    is_toxic = models.BooleanField(default=False)

    # Confidence score from the model (0.0 → 1.0)
    # Values closer to 1.0 = more likely toxic
    confidence_score = models.FloatField(default=0.0)

    # Raw probability for the toxic class
    toxic_probability = models.FloatField(default=0.0)

    # Raw probability for the non-toxic class
    non_toxic_probability = models.FloatField(default=0.0)

    # Whether the model was loaded successfully
    model_available = models.BooleanField(default=True)

    # Admin override support
    is_reviewed = models.BooleanField(default=False)
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_image_toxicity_logs'
    )
    review_notes = models.TextField(blank=True, null=True)
    overridden = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_toxic', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]

    def __str__(self):
        return (
            f"ImageToxicityLog [is_toxic={self.is_toxic}] "
            f"score={self.confidence_score:.2f} at {self.created_at}"
        )
