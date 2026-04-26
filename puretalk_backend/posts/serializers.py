from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import (
    Post, PostMedia, PostLike, Comment, CommentLike,
    PostSave, PostReport, PostType, PostPrivacy, PostStatus
)
from users.serializers import UserProfileSerializer

User = get_user_model()


class PostMediaSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PostMedia
        fields = ['id', 'file', 'file_url', 'media_type', 'thumbnail', 'order', 'duration']
        read_only_fields = ['id', 'file_url', 'media_type']
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class PostLikeSerializer(serializers.ModelSerializer):
    user_detail = UserProfileSerializer(source='user', read_only=True)
    
    class Meta:
        model = PostLike
        fields = ['id', 'user', 'user_detail', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CommentLikeSerializer(serializers.ModelSerializer):
    user_detail = UserProfileSerializer(source='user', read_only=True)
    
    class Meta:
        model = CommentLike
        fields = ['id', 'user', 'user_detail', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author_detail = UserProfileSerializer(source='author', read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    reply_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'post', 'author', 'author_detail', 'parent',
            'content', 'like_count', 'reply_count', 'user_has_liked',
            'replies', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'like_count', 'reply_count', 'created_at', 'updated_at']
    
    def get_user_has_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return CommentLike.objects.filter(comment=obj, user=user, is_active=True).exists()
        return False
    
    def get_replies(self, obj):
        if obj.reply_count > 0:
            replies = obj.replies.filter(is_active=True)[:5]
            return CommentSerializer(replies, many=True, context=self.context).data
        return []


class CreateCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['post', 'parent', 'content']
    
    def validate(self, data):
        post = data.get('post')
        parent = data.get('parent')
        
        # Check if post exists and is viewable
        user = self.context['request'].user
        if not post.can_view(user):
            raise serializers.ValidationError({"post": "You cannot comment on this post"})
        
        # Check if parent comment exists and is active
        if parent:
            if not parent.is_active:
                raise serializers.ValidationError({"parent": "Cannot reply to a deleted comment"})
            if parent.post != post:
                raise serializers.ValidationError({"parent": "Parent comment belongs to a different post"})
        
        return data
    
    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class PostSerializer(serializers.ModelSerializer):
    author_detail = UserProfileSerializer(source='author', read_only=True)
    media = PostMediaSerializer(many=True, read_only=True)
    uploaded_media = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    like_count = serializers.IntegerField(read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    share_count = serializers.IntegerField(read_only=True)
    user_has_liked = serializers.SerializerMethodField()
    user_has_saved = serializers.SerializerMethodField()
    user_reaction = serializers.SerializerMethodField()
    recent_comments = serializers.SerializerMethodField()
    original_post_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'author_detail', 'content', 'post_type',
            'privacy', 'status', 'media', 'uploaded_media',
            'original_post', 'original_post_detail', 'share_message',
            'link_url', 'link_title', 'link_description', 'link_image',
            'location_name', 'location_lat', 'location_lng',
            'feeling', 'feeling_emoji',
            'like_count', 'comment_count', 'share_count',
            'user_has_liked', 'user_has_saved', 'user_reaction',
            'recent_comments', 'created_at', 'updated_at', 'scheduled_for'
        ]
        read_only_fields = [
            'id', 'author', 'like_count', 'comment_count', 'share_count',
            'created_at', 'updated_at'
        ]
    
    def get_user_has_liked(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return PostLike.objects.filter(post=obj, user=user, is_active=True).exists()
        return False
    
    def get_user_has_saved(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            return PostSave.objects.filter(post=obj, user=user).exists()
        return False
    
    def get_user_reaction(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated:
            like = PostLike.objects.filter(post=obj, user=user, is_active=True).first()
            return like.reaction_type if like else None
        return None
    
    def get_recent_comments(self, obj):
        comments = obj.comments.filter(is_active=True, parent__isnull=True)[:3]
        return CommentSerializer(comments, many=True, context=self.context).data
    
    def get_original_post_detail(self, obj):
        if obj.original_post:
            return PostSerializer(obj.original_post, context=self.context).data
        return None
    
    def create(self, validated_data):
        uploaded_media = validated_data.pop('uploaded_media', [])
        request = self.context.get('request')
        
        # Set author
        validated_data['author'] = request.user
        
        # Create post
        post = Post.objects.create(**validated_data)
        
        # Handle media uploads
        for order, media_file in enumerate(uploaded_media):
            PostMedia.objects.create(
                post=post,
                file=media_file,
                order=order
            )
        
        # Auto-detect post type based on media
        if uploaded_media:
            media_types = [m.media_type for m in post.media.all()]
            if 'video' in media_types:
                post.post_type = PostType.VIDEO
            elif 'image' in media_types or 'gif' in media_types:
                post.post_type = PostType.IMAGE
            post.save(update_fields=['post_type'])
        
        return post
    
    def update(self, instance, validated_data):
        uploaded_media = validated_data.pop('uploaded_media', [])
        
        # Update fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Add new media if any
        if uploaded_media:
            current_order = instance.media.count()
            for order, media_file in enumerate(uploaded_media, start=current_order):
                PostMedia.objects.create(
                    post=instance,
                    file=media_file,
                    order=order
                )
        
        return instance


class CreatePostSerializer(serializers.ModelSerializer):
    uploaded_media = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    
    class Meta:
        model = Post
        fields = [
            'content', 'privacy', 'post_type', 'uploaded_media',
            'original_post', 'share_message', 'link_url',
            'location_name', 'feeling', 'feeling_emoji', 'scheduled_for'
        ]
    
    def validate(self, data):
        post_type = data.get('post_type', PostType.TEXT)
        
        if post_type == PostType.SHARE and not data.get('original_post'):
            raise serializers.ValidationError({"original_post": "Original post is required for sharing"})
        
        if post_type == PostType.LINK and not data.get('link_url'):
            raise serializers.ValidationError({"link_url": "URL is required for link posts"})
        
        # Check if user is trying to share a private post they can't see
        if data.get('original_post'):
            original = data['original_post']
            if not original.can_view(self.context['request'].user):
                raise serializers.ValidationError({"original_post": "You cannot share this post"})
        
        return data
    
    def create(self, validated_data):
        uploaded_media = validated_data.pop('uploaded_media', [])
        validated_data['author'] = self.context['request'].user
        
        post = Post.objects.create(**validated_data)
        
        for order, media_file in enumerate(uploaded_media):
            PostMedia.objects.create(post=post, file=media_file, order=order)
        
        if uploaded_media and post.post_type == PostType.TEXT:
            media_types = [m.media_type for m in post.media.all()]
            if 'video' in media_types:
                post.post_type = PostType.VIDEO
            elif 'image' in media_types or 'gif' in media_types:
                post.post_type = PostType.IMAGE
            post.save(update_fields=['post_type'])
        
        return post


class PostUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Post
        fields = ['content', 'privacy', 'location_name', 'feeling', 'feeling_emoji']
    
    def validate_privacy(self, value):
        # Cannot change privacy of shared post to only_me if original is shareable
        instance = getattr(self, 'instance', None)
        if instance and instance.post_type == PostType.SHARE and value == PostPrivacy.ONLY_ME:
            raise serializers.ValidationError("Cannot set shared post to 'Only Me'")
        return value


class ReactionSerializer(serializers.Serializer):
    reaction_type = serializers.ChoiceField(
        choices=['like', 'love', 'haha', 'wow', 'sad', 'angry'],
        default='like'
    )


class PostReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostReport
        fields = ['reason', 'description']
    
    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        validated_data['post_id'] = self.context['post_id']
        return super().create(validated_data)


class FeedPostSerializer(PostSerializer):
    """Simplified serializer for feed to improve performance"""
    class Meta(PostSerializer.Meta):
        fields = [
            'id', 'author_detail', 'content', 'post_type', 'privacy',
            'media', 'like_count', 'comment_count', 'share_count',
            'user_has_liked', 'user_has_saved', 'user_reaction',
            'recent_comments', 'created_at'
        ]


class PostStatsSerializer(serializers.Serializer):
    total_posts = serializers.IntegerField()
    today_posts = serializers.IntegerField()
    week_posts = serializers.IntegerField()
    month_posts = serializers.IntegerField()
    total_likes = serializers.IntegerField()
    total_comments = serializers.IntegerField()
    total_shares = serializers.IntegerField()
    top_posts = serializers.ListField()
    posts_by_type = serializers.DictField()