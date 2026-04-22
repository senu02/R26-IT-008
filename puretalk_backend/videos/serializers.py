from rest_framework import serializers
from django.conf import settings
from django.db.models import Q
from .models import (
    Video, VideoLike, VideoComment, CommentLike, 
    VideoView, VideoReport
)
from users.serializers import UserProfileSerializer
from friends.models import Friendship


class VideoSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField(read_only=True)
    video_url = serializers.SerializerMethodField(read_only=True)
    thumbnail_url = serializers.SerializerMethodField(read_only=True)
    is_liked = serializers.SerializerMethodField(read_only=True)
    can_view = serializers.SerializerMethodField(read_only=True)
    can_edit = serializers.SerializerMethodField(read_only=True)
    can_delete = serializers.SerializerMethodField(read_only=True)
    privacy_display = serializers.SerializerMethodField(read_only=True)
    is_blocked_display = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = Video
        fields = [
            'id', 'user', 'user_details', 'title', 'description',
            'video_file', 'video_url', 'thumbnail', 'thumbnail_url',
            'privacy', 'privacy_display', 'allow_comments', 'allow_sharing',
            'views_count', 'likes_count', 'comments_count', 'shares_count',
            'duration', 'created_at', 'updated_at', 'is_liked', 'can_view',
            'can_edit', 'can_delete', 'is_blocked', 'is_blocked_display'
        ]
        read_only_fields = [
            'id', 'user', 'views_count', 'likes_count', 
            'comments_count', 'shares_count', 'created_at', 'updated_at',
            'is_blocked'
        ]
    
    def get_user_details(self, obj):
        return UserProfileSerializer(obj.user).data
    
    def get_video_url(self, obj):
        return obj.video_url
    
    def get_thumbnail_url(self, obj):
        return obj.thumbnail_url
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return VideoLike.objects.filter(user=request.user, video=obj).exists()
        return False
    
    def get_can_view(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_user_view(request.user)
        return obj.privacy == 'public' and not obj.is_blocked
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_user_edit(request.user)
        return False
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_user_delete(request.user)
        return False
    
    def get_privacy_display(self, obj):
        return dict(Video.PRIVACY_CHOICES).get(obj.privacy, obj.privacy)
    
    def get_is_blocked_display(self, obj):
        if obj.is_blocked:
            return f"Blocked: {obj.blocked_reason or 'No reason provided'}"
        return "Not blocked"
    
    def validate_video_file(self, value):
        max_size = 500 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError(f"Video file too large. Max size is 500MB")
        
        allowed_extensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm']
        import os
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in allowed_extensions:
            raise serializers.ValidationError(f"Unsupported video format. Allowed: {', '.join(allowed_extensions)}")
        
        # Role-based upload limits
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            if request.user.role == 'user':
                # Regular users can only upload up to 100MB
                if value.size > 100 * 1024 * 1024:
                    raise serializers.ValidationError("Regular users can only upload videos up to 100MB")
        
        return value
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class VideoDetailSerializer(VideoSerializer):
    comments = serializers.SerializerMethodField(read_only=True)
    related_videos = serializers.SerializerMethodField(read_only=True)
    
    class Meta(VideoSerializer.Meta):
        fields = VideoSerializer.Meta.fields + ['comments', 'related_videos']
    
    def get_comments(self, obj):
        from .serializers import VideoCommentSerializer
        request = self.context.get('request')
        
        if not obj.can_user_view(request.user):
            return []
        
        comments = obj.comments.filter(parent=None)[:20]
        return VideoCommentSerializer(comments, many=True, context=self.context).data
    
    def get_related_videos(self, obj):
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            friends = Friendship.objects.filter(user=request.user).values_list('friend_id', flat=True)
            
            related = Video.objects.filter(
                Q(privacy='public', is_blocked=False) |
                Q(user=obj.user) |
                (Q(user__in=friends) & Q(privacy='friends') & Q(is_blocked=False))
            ).exclude(id=obj.id).order_by('-views_count')[:10]
        else:
            related = Video.objects.filter(privacy='public', is_blocked=False).exclude(id=obj.id).order_by('-views_count')[:10]
        
        return VideoSerializer(related, many=True, context=self.context).data


class VideoCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['title', 'description', 'video_file', 'thumbnail', 'privacy', 'allow_comments', 'allow_sharing']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class VideoLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoLike
        fields = ['id', 'user', 'video', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class VideoCommentSerializer(serializers.ModelSerializer):
    user_details = serializers.SerializerMethodField(read_only=True)
    is_liked = serializers.SerializerMethodField(read_only=True)
    replies = serializers.SerializerMethodField(read_only=True)
    replies_count = serializers.SerializerMethodField(read_only=True)
    can_view = serializers.SerializerMethodField(read_only=True)
    can_delete = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = VideoComment
        fields = [
            'id', 'user', 'user_details', 'video', 'parent',
            'content', 'likes_count', 'created_at', 'updated_at',
            'is_liked', 'replies', 'replies_count', 'can_view', 'can_delete'
        ]
        read_only_fields = ['id', 'user', 'likes_count', 'created_at', 'updated_at']
    
    def get_user_details(self, obj):
        return UserProfileSerializer(obj.user).data
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return CommentLike.objects.filter(user=request.user, comment=obj).exists()
        return False
    
    def get_replies(self, obj):
        request = self.context.get('request')
        replies = obj.replies.all()[:5]
        
        filtered_replies = []
        for reply in replies:
            if reply.video.can_user_view(request.user):
                filtered_replies.append(reply)
        
        return VideoCommentSerializer(filtered_replies, many=True, context=self.context).data
    
    def get_replies_count(self, obj):
        request = self.context.get('request')
        count = 0
        for reply in obj.replies.all():
            if reply.video.can_user_view(request.user):
                count += 1
        return count
    
    def get_can_view(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.video.can_user_view(request.user)
        return obj.video.privacy == 'public' and not obj.video.is_blocked
    
    def get_can_delete(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_user_delete(request.user)
        return False
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class CommentLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'comment', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class VideoReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoReport
        fields = ['id', 'reporter', 'video', 'reason', 'description', 'created_at', 'resolved']
        read_only_fields = ['id', 'reporter', 'created_at', 'resolved']
    
    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)


class VideoAnalyticsSerializer(serializers.Serializer):
    total_videos = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_likes = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    total_shares = serializers.IntegerField()
    average_views_per_video = serializers.FloatField()
    engagement_rate = serializers.FloatField()


class ModerationQueueSerializer(serializers.ModelSerializer):
    """Serializer for moderation queue"""
    user_details = UserProfileSerializer(source='user', read_only=True)
    report_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Video
        fields = ['id', 'title', 'description', 'user_details', 'privacy', 
                  'views_count', 'likes_count', 'created_at', 'is_flagged', 
                  'flagged_reason', 'report_count']