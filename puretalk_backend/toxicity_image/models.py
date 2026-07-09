from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class ToxicImageLog(models.Model):
    """
    Stores every image toxicity check result.
    Useful for audit trail, reporting, and moderation dashboard.
    """

    MODEL_CHOICES = [
        ("h5",  "MobileNetV2 (.h5)"),
        ("pkl", "Keras Pickle (.pkl)"),
    ]

    LABEL_CHOICES = [
        ("TOXIC", "Toxic"),
        ("SAFE",  "Safe"),
    ]

    user        = models.ForeignKey(
                    User,
                    on_delete=models.SET_NULL,
                    null=True, blank=True,
                    related_name="toxicity_checks",
                    help_text="User who uploaded the image (null if anonymous)."
                  )
    image_name  = models.CharField(max_length=255, help_text="Original filename.")
    score       = models.FloatField(help_text="Raw model output score (0.0 – 1.0).")
    label       = models.CharField(max_length=10, choices=LABEL_CHOICES)
    is_toxic    = models.BooleanField()
    confidence  = models.FloatField(help_text="Confidence percentage.")
    model_used  = models.CharField(max_length=10, choices=MODEL_CHOICES, default="h5")
    threshold   = models.FloatField(default=0.5)
    checked_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-checked_at"]
        verbose_name     = "Toxic Image Log"
        verbose_name_plural = "Toxic Image Logs"

    def __str__(self):
        return f"[{self.label}] {self.image_name} — {self.score:.4f} ({self.checked_at:%Y-%m-%d %H:%M})"