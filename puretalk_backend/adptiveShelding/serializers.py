from rest_framework import serializers
from .models import ToxicityRecord


class AnalyzeRequestSerializer(serializers.Serializer):
    """Input: the message text to analyze."""
    text = serializers.CharField(min_length=1, max_length=5000)
    # Optional: lets the frontend tell us whether this check is happening
    # for a post or a comment, purely for accurate BehaviorEvent logging.
    content_type = serializers.ChoiceField(
        choices=["post", "comment"], default="post", required=False
    )


class AnalyzeResponseSerializer(serializers.Serializer):
    """Output: full AESM result."""
    strategy = serializers.CharField()
    output = serializers.CharField()
    toxicity = serializers.FloatField()
    behavior = serializers.FloatField()
    final_score = serializers.FloatField()
    support = serializers.CharField(required=False, allow_null=True)
    new_toxicity = serializers.FloatField(required=False, allow_null=True)


class ToxicityRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToxicityRecord
        fields = [
            "id", "message", "strategy",
            "toxicity_score", "behavior_score", "final_score",
            "processed_output", "created_at",
        ]
        read_only_fields = fields