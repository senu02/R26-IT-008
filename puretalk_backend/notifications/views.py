from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Notification
from .serializers import NotificationSerializer


class NotificationViewSet(viewsets.GenericViewSet):
    """
    Notification endpoints. Works the same way for a normal user
    checking their own warnings/blocks and for an admin checking their
    own admin alerts — both are just `Notification` rows where
    `recipient == request.user`.
    """

    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='my-notifications')
    def my_notifications(self, request):
        """List the logged-in user's notifications (newest first)."""
        qs = Notification.objects.filter(recipient=request.user)

        unread_only = request.query_params.get('unread_only')
        if unread_only and unread_only.lower() == 'true':
            qs = qs.filter(is_read=False)

        notif_type = request.query_params.get('type')
        if notif_type:
            qs = qs.filter(notification_type=notif_type)

        page = self.paginate_queryset(qs)
        if page is not None:
            return self.get_paginated_response(
                NotificationSerializer(page, many=True).data
            )
        return Response(NotificationSerializer(qs, many=True).data)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        """Badge count for the notification bell icon."""
        count = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """Mark a single notification as read."""
        notif = get_object_or_404(
            Notification, pk=pk, recipient=request.user
        )
        notif.is_read = True
        notif.save(update_fields=['is_read'])
        return Response({'message': 'Notification marked as read.'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """Mark every notification belonging to the logged-in user as read."""
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({'message': f'{updated} notification(s) marked as read.'})
