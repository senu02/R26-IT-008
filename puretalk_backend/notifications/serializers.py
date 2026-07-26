from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    related_user_email = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'related_user', 'related_user_email', 'metadata',
            'is_read', 'created_at',
        ]
        read_only_fields = fields

    def get_related_user_email(self, obj):
        return obj.related_user.email if obj.related_user_id else None
