from rest_framework import serializers
from .models import ImageToxicityLog


class ImageToxicityLogSerializer(serializers.ModelSerializer):
    author_username = serializers.CharField(
        source='author.username', read_only=True
    )

    class Meta:
        model = ImageToxicityLog
        fields = [
            'id',
            'author',
            'author_username',
            'post',
            'content_type',
            'image',
            'is_toxic',
            'confidence_score',
            'toxic_probability',
            'non_toxic_probability',
            'model_available',
            'is_reviewed',
            'reviewer',
            'review_notes',
            'overridden',
            'created_at',
        ]
        read_only_fields = [
            'id', 'author', 'is_toxic', 'confidence_score',
            'toxic_probability', 'non_toxic_probability',
            'model_available', 'created_at',
        ]


class ImageCheckResultSerializer(serializers.Serializer):
    """Lightweight serializer for quick-check responses (no DB save)."""
    is_toxic = serializers.BooleanField()
    confidence_score = serializers.FloatField()
    toxic_probability = serializers.FloatField()
    non_toxic_probability = serializers.FloatField()
    model_available = serializers.BooleanField()
    message = serializers.CharField()
