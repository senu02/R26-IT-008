from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from friends.models import Friendship

from .models import Story
from .serializers import StorySerializer


class StoryViewSet(viewsets.ModelViewSet):
    """Create/list/delete image stories. Feed is latest story per user within 24h (friends + self)."""

    serializer_class = StorySerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return Story.objects.select_related('user')

    def list(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        user = request.user
        since = timezone.now() - timedelta(hours=24)
        # Friends in both directions (rows where you are `user` or `friend`)
        friends_as_owner = Friendship.objects.filter(user=user).values_list(
            'friend_id', flat=True
        )
        friends_as_other = Friendship.objects.filter(friend=user).values_list(
            'user_id', flat=True
        )
        friend_ids = list(set(friends_as_owner) | set(friends_as_other))
        allowed_ids = friend_ids + [user.id]

        qs = (
            Story.objects.filter(user_id__in=allowed_ids, created_at__gte=since)
            .select_related('user')
            .order_by('-created_at')
        )

        seen = set()
        unique = []
        for story in qs:
            if story.user_id not in seen:
                seen.add(story.user_id)
                unique.append(story)

        mine = [s for s in unique if s.user_id == user.id]
        others = [s for s in unique if s.user_id != user.id]
        others.sort(key=lambda s: s.created_at, reverse=True)
        ordered = mine + others

        serializer = StorySerializer(ordered, many=True, context={'request': request})
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)

    def destroy(self, request, *args, **kwargs):
        story = self.get_object()
        if story.user_id != request.user.id:
            raise PermissionDenied('You can only delete your own stories.')
        return super().destroy(request, *args, **kwargs)
