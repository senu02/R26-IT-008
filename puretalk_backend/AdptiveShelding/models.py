from django.db import models
from django.conf import settings


class ToxicityRecord(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='toxicity_records',
        null=True,
        blank=True,
    )
    message = models.TextField()
    strategy = models.CharField(max_length=50)        # Safe / Warning / Blurring / Filtering / Rewriting
    toxicity_score = models.FloatField(default=0.0)
    behavior_score = models.FloatField(default=0.0)
    final_score = models.FloatField(default=0.0)
    processed_output = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user} | {self.strategy} | {self.final_score:.2f}"
