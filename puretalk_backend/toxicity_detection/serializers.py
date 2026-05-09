from rest_framework import serializers
from .models import ToxicityLog, UserToxicityProfile


class ToxicityLogSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source='author.email', read_only=True)
    reviewer_email = serializers.EmailField(source='reviewer.email', read_only=True, allow_null=True)

    class Meta:
        model = ToxicityLog
        fields = [
            'id', 'content_type', 'post', 'comment',
            'author', 'author_email',
            'analysed_text', 'is_toxic', 'max_score',
            'label_scores', 'flagged_labels',
            'is_reviewed', 'reviewer', 'reviewer_email',
            'review_notes', 'overridden',
            'created_at',
        ]
        read_only_fields = fields


class UserToxicityProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    toxicity_rate = serializers.FloatField(read_only=True)
    total_toxic_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserToxicityProfile
        fields = [
            'id', 'user', 'user_email',
            'total_posts_checked', 'toxic_post_count',
            'total_comments_checked', 'toxic_comment_count',
            'total_toxic_count', 'toxicity_rate',
            'highest_toxicity_score',
            'is_flagged', 'is_suspended',
            'last_toxic_at', 'updated_at',
        ]
        read_only_fields = fields