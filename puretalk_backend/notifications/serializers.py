from rest_framework import serializers
from .models import Notification
from users.serializers import UserProfileSerializer

class NotificationSerializer(serializers.ModelSerializer):
    sender_detail = UserProfileSerializer(source='sender', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_detail', 'notification_type',
            'message', 'reference_id', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
