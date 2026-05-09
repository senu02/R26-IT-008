from rest_framework import serializers
from .models import ToxicImageLog

ALLOWED_TYPES   = ["image/jpeg", "image/png", "image/webp", "image/gif"]
MAX_SIZE_MB     = 10


# ─── Request Serializers ──────────────────────────────────────────────────────

class ToxicImageSerializer(serializers.Serializer):
    """Validates a single image upload."""

    image = serializers.ImageField(
        help_text="Image file (JPEG, PNG, WEBP, GIF). Max 10 MB."
    )
    model = serializers.ChoiceField(
        choices=["h5", "pkl"],
        default="h5",
        required=False,
        help_text="'h5' = MobileNetV2 (default) | 'pkl' = Keras pickle model."
    )
    threshold = serializers.FloatField(
        default=0.5,
        required=False,
        min_value=0.0,
        max_value=1.0,
        help_text="Score threshold to flag as toxic (default: 0.5)."
    )

    def validate_image(self, value):
        if hasattr(value, "content_type") and value.content_type not in ALLOWED_TYPES:
            raise serializers.ValidationError(
                f"Unsupported type '{value.content_type}'. Allowed: {', '.join(ALLOWED_TYPES)}"
            )
        if value.size > MAX_SIZE_MB * 1024 * 1024:
            raise serializers.ValidationError(
                f"File too large ({value.size / 1024 / 1024:.1f} MB). Max is {MAX_SIZE_MB} MB."
            )
        return value


class ToxicImageBatchSerializer(serializers.Serializer):
    """Validates a batch image upload."""

    model = serializers.ChoiceField(
        choices=["h5", "pkl"],
        default="h5",
        required=False,
    )
    threshold = serializers.FloatField(
        default=0.5,
        required=False,
        min_value=0.0,
        max_value=1.0,
    )


# ─── Response / Log Serializers ───────────────────────────────────────────────

class ToxicImageLogSerializer(serializers.ModelSerializer):
    """Serializes stored ToxicImageLog records."""

    class Meta:
        model  = ToxicImageLog
        fields = [
            "id", "image_name", "label", "is_toxic",
            "score", "confidence", "model_used",
            "threshold", "checked_at",
        ]
        read_only_fields = fields
