from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Sum, F
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import (
    Video, VideoLike, VideoComment, CommentLike, 
    VideoView, VideoReport
)
from .serializers import (
    VideoSerializer, VideoDetailSerializer, VideoCreateSerializer,
    VideoLikeSerializer, VideoCommentSerializer, CommentLikeSerializer,
    VideoReportSerializer, VideoAnalyticsSerializer, ModerationQueueSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from friends.models import Friendship
from django.contrib.auth import get_user_model

User = get_user_model()


class IsModeratorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_moderator


class IsAdminOrSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_manage_users()


class VideoViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_queryset(self):
        user = self.request.user
        
        friends = Friendship.objects.filter(user=user).values_list('friend_id', flat=True)
        
        # Role-based queryset
        if user.is_super_admin:
            queryset = Video.objects.all()
        elif user.is_admin:
            # Admins can see all except super admin videos
            queryset = Video.objects.exclude(user__role='super_admin')
        elif user.is_moderator:
            # Moderators can see flagged videos and regular user videos
            queryset = Video.objects.filter(
                Q(is_flagged=True) | Q(user__role='user')
            )
        else:
            # Regular users: public, friends, own videos (not blocked)
            queryset = Video.objects.filter(
                Q(privacy='public', is_blocked=False) | 
                Q(user=user) |
                (Q(privacy='friends', is_blocked=False) & Q(user__in=friends))
            )
        
        # Apply filters
        user_filter = self.request.query_params.get('user')
        if user_filter:
            if str(user_filter) == str(user.id) or user.is_moderator:
                queryset = queryset.filter(user_id=user_filter)
            else:
                queryset = queryset.filter(user_id=user_filter, privacy='public', is_blocked=False)
        
        # Moderation filters
        if user.is_moderator:
            flagged_filter = self.request.query_params.get('flagged')
            if flagged_filter == 'true':
                queryset = queryset.filter(is_flagged=True)
            elif flagged_filter == 'false':
                queryset = queryset.filter(is_flagged=False)
            
            blocked_filter = self.request.query_params.get('blocked')
            if blocked_filter == 'true':
                queryset = queryset.filter(is_blocked=True)
            elif blocked_filter == 'false':
                queryset = queryset.filter(is_blocked=False)
        
        # Search
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
        
        return queryset.select_related('user').prefetch_related('likes')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return VideoCreateSerializer
        elif self.action == 'retrieve':
            return VideoDetailSerializer
        return VideoSerializer
    
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance.can_user_view(request.user):
            return Response(
                {"error": "You don't have permission to view this video"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Record view (only for non-admins to avoid skewing stats)
        if not request.user.is_moderator:
            VideoView.objects.create(
                user=request.user,
                video=instance,
                ip_address=request.META.get('REMOTE_ADDR')
            )
            instance.increment_views()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        # Check upload limits based on role
        if request.user.role == 'user':
            daily_uploads = Video.objects.filter(
                user=request.user,
                created_at__date=timezone.now().date()
            ).count()
            
            if daily_uploads >= 10:
                return Response(
                    {"error": "Daily upload limit reached (10 videos per day for regular users)"},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        if not instance.can_user_edit(request.user):
            return Response(
                {"error": "You don't have permission to edit this video"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance.can_user_delete(request.user):
            return Response(
                {"error": "You don't have permission to delete this video"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        self.perform_destroy(instance)
        return Response(
            {"message": "Video deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['post'], url_path='like')
    def like_video(self, request, pk=None):
        video = self.get_object()
        
        if not video.can_user_view(request.user):
            return Response(
                {"error": "You cannot like this video"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        like, created = VideoLike.objects.get_or_create(
            user=request.user,
            video=video
        )
        
        if created:
            video.increment_likes()
            return Response({"message": "Video liked", "liked": True}, status=status.HTTP_201_CREATED)
        else:
            like.delete()
            video.decrement_likes()
            return Response({"message": "Video unliked", "liked": False}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='share')
    def share_video(self, request, pk=None):
        video = self.get_object()
        
        if not video.can_user_view(request.user):
            return Response(
                {"error": "You cannot share this video"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        video.increment_shares()
        return Response({"message": "Video shared", "shares_count": video.shares_count})
    
    @action(detail=True, methods=['post'], url_path='report')
    def report_video(self, request, pk=None):
        video = self.get_object()
        
        if VideoReport.objects.filter(reporter=request.user, video=video).exists():
            return Response(
                {"error": "You have already reported this video"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = VideoReportSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        report = serializer.save(video=video)
        
        # Auto-flag video after 3 reports
        report_count = VideoReport.objects.filter(video=video, resolved=False).count()
        if report_count >= 3:
            video.flag_for_moderation(reason=f"Auto-flagged due to {report_count} reports")
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], url_path='block')
    def block_video(self, request, pk=None):
        """Admin only: Block a video"""
        if not request.user.is_admin:
            return Response(
                {"error": "Only admins can block videos"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        video = self.get_object()
        
        reason = request.data.get('reason', 'Blocked by admin')
        video.block_video(reason=reason, moderator=request.user)
        
        return Response({
            "message": "Video blocked successfully",
            "blocked_reason": video.blocked_reason
        })
    
    @action(detail=True, methods=['post'], url_path='unblock')
    def unblock_video(self, request, pk=None):
        """Admin only: Unblock a video"""
        if not request.user.is_admin:
            return Response(
                {"error": "Only admins can unblock videos"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        video = self.get_object()
        video.unblock_video()
        
        return Response({"message": "Video unblocked successfully"})
    
    @action(detail=False, methods=['get'], url_path='trending')
    def trending_videos(self, request):
        last_week = timezone.now() - timezone.timedelta(days=7)
        
        trending = Video.objects.filter(
            created_at__gte=last_week,
            privacy='public',
            is_blocked=False
        ).annotate(
            engagement_score=F('views_count') + (F('likes_count') * 2) + (F('comments_count') * 3)
        ).order_by('-engagement_score')[:20]
        
        serializer = self.get_serializer(trending, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='feed')
    def feed(self, request):
        user = request.user
        
        friends = Friendship.objects.filter(user=user).values_list('friend_id', flat=True)
        
        public_videos = Video.objects.filter(privacy='public', is_blocked=False)[:20]
        friends_videos = Video.objects.filter(privacy='friends', is_blocked=False, user__in=friends)[:20]
        own_videos = Video.objects.filter(user=user)[:10]
        
        all_videos = list(public_videos) + list(friends_videos) + list(own_videos)
        seen_ids = set()
        unique_videos = []
        
        for video in all_videos:
            if video.id not in seen_ids:
                seen_ids.add(video.id)
                unique_videos.append(video)
        
        unique_videos.sort(key=lambda x: x.created_at, reverse=True)
        unique_videos = unique_videos[:30]
        
        serializer = self.get_serializer(unique_videos, many=True)
        return Response({
            'count': len(unique_videos),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='moderation-queue')
    def moderation_queue(self, request):
        """Get flagged videos for moderation (Moderator/Admin only)"""
        if not request.user.is_moderator:
            return Response(
                {"error": "You don't have permission to view moderation queue"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        flagged_videos = Video.objects.filter(
            is_flagged=True,
            is_blocked=False
        ).annotate(
            report_count=Count('reports', filter=Q(reports__resolved=False))
        ).order_by('-report_count', '-flagged_at')
        
        if request.user.role == 'admin':
            flagged_videos = flagged_videos.exclude(user__role='super_admin')
        elif request.user.role == 'moderator':
            flagged_videos = flagged_videos.filter(user__role='user')
        
        page = self.paginate_queryset(flagged_videos)
        if page is not None:
            serializer = ModerationQueueSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = ModerationQueueSerializer(flagged_videos, many=True)
        return Response({
            'count': flagged_videos.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='resolve-flag')
    def resolve_flag(self, request, pk=None):
        """Moderator: Resolve flag on a video"""
        if not request.user.is_moderator:
            return Response(
                {"error": "You don't have permission to resolve flags"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        video = self.get_object()
        video.is_flagged = False
        video.flagged_reason = None
        video.flagged_at = None
        video.save(update_fields=['is_flagged', 'flagged_reason', 'flagged_at'])
        
        return Response({"message": "Video flag resolved successfully"})
    
    @action(detail=False, methods=['get'], url_path='analytics')
    def analytics(self, request):
        user = request.user
        user_videos = Video.objects.filter(user=user)
        
        total_videos = user_videos.count()
        total_views = user_videos.aggregate(total=Sum('views_count'))['total'] or 0
        total_likes = user_videos.aggregate(total=Sum('likes_count'))['total'] or 0
        total_comments = user_videos.aggregate(total=Sum('comments_count'))['total'] or 0
        total_shares = user_videos.aggregate(total=Sum('shares_count'))['total'] or 0
        
        average_views_per_video = total_views / total_videos if total_videos > 0 else 0
        engagement_rate = ((total_likes + total_comments + total_shares) / total_views * 100) if total_views > 0 else 0
        
        data = {
            'total_videos': total_videos,
            'total_views': total_views,
            'total_likes': total_likes,
            'total_comments': total_comments,
            'total_shares': total_shares,
            'average_views_per_video': round(average_views_per_video, 2),
            'engagement_rate': round(engagement_rate, 2),
        }
        
        serializer = VideoAnalyticsSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='admin/stats')
    def admin_stats(self, request):
        """Get platform-wide video statistics (Admin only)"""
        if not request.user.is_admin:
            return Response(
                {"error": "Only admins can view platform statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = {
            'total_videos': Video.objects.count(),
            'total_views': Video.objects.aggregate(total=Sum('views_count'))['total'] or 0,
            'total_likes': Video.objects.aggregate(total=Sum('likes_count'))['total'] or 0,
            'total_comments': Video.objects.aggregate(total=Sum('comments_count'))['total'] or 0,
            'flagged_videos': Video.objects.filter(is_flagged=True).count(),
            'blocked_videos': Video.objects.filter(is_blocked=True).count(),
            'reports_pending': VideoReport.objects.filter(resolved=False).count(),
            'by_role': {
                'user_videos': Video.objects.filter(user__role='user').count(),
                'moderator_videos': Video.objects.filter(user__role='moderator').count(),
                'admin_videos': Video.objects.filter(user__role='admin').count(),
            }
        }
        
        return Response(stats)


class CommentViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VideoCommentSerializer
    
    def get_queryset(self):
        video_id = self.request.query_params.get('video')
        user = self.request.user
        
        if video_id:
            try:
                video = Video.objects.get(id=video_id)
                if video.can_user_view(user):
                    return VideoComment.objects.filter(video_id=video_id, parent=None)
            except Video.DoesNotExist:
                pass
            return VideoComment.objects.none()
        
        # Role-based comment filtering
        if user.is_super_admin:
            comments = VideoComment.objects.all()
        elif user.is_admin:
            comments = VideoComment.objects.exclude(video__user__role='super_admin')
        elif user.is_moderator:
            comments = VideoComment.objects.filter(video__user__role='user')
        else:
            friends = Friendship.objects.filter(user=user).values_list('friend_id', flat=True)
            viewable_videos = Video.objects.filter(
                Q(privacy='public', is_blocked=False) |
                Q(user=user) |
                (Q(privacy='friends', is_blocked=False) & Q(user__in=friends))
            ).values_list('id', flat=True)
            comments = VideoComment.objects.filter(video_id__in=viewable_videos, parent=None)
        
        return comments
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        video_id = request.data.get('video')
        try:
            video = Video.objects.get(id=video_id)
            if not video.can_user_view(request.user):
                return Response(
                    {"error": "You cannot comment on this video"},
                    status=status.HTTP_403_FORBIDDEN
                )
            if not video.allow_comments:
                return Response(
                    {"error": "Comments are disabled for this video"},
                    status=status.HTTP_403_FORBIDDEN
                )
        except Video.DoesNotExist:
            return Response(
                {"error": "Video not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        self.perform_create(serializer)
        video.increment_comments()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        if not instance.can_user_delete(request.user):
            return Response(
                {"error": "You don't have permission to delete this comment"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        video = instance.video
        self.perform_destroy(instance)
        video.decrement_comments()
        
        return Response(
            {"message": "Comment deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['post'], url_path='like')
    def like_comment(self, request, pk=None):
        comment = self.get_object()
        
        if not comment.video.can_user_view(request.user):
            return Response(
                {"error": "You cannot like this comment"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        like, created = CommentLike.objects.get_or_create(
            user=request.user,
            comment=comment
        )
        
        if created:
            comment.increment_likes()
            return Response({"message": "Comment liked", "liked": True}, status=status.HTTP_201_CREATED)
        else:
            like.delete()
            comment.decrement_likes()
            return Response({"message": "Comment unliked", "liked": False}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='replies')
    def get_replies(self, request, pk=None):
        comment = self.get_object()
        
        if not comment.video.can_user_view(request.user):
            return Response(
                {"error": "You cannot view these replies"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        replies = comment.replies.all()
        serializer = self.get_serializer(replies, many=True)
        return Response(serializer.data)