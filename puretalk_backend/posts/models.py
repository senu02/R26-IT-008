from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import os

User = settings.AUTH_USER_MODEL


def post_image_path(instance, filename):
    """Generate file path for post images"""
    ext = filename.split('.')[-1]
    filename = f"{timezone.now().strftime('%Y%m%d_%H%M%S')}_{instance.post.id}_{instance.id}.{ext}"
    return os.path.join('posts', 'images', filename)


def post_video_path(instance, filename):
    """Generate file path for post videos"""
    ext = filename.split('.')[-1]
    filename = f"{timezone.now().strftime('%Y%m%d_%H%M%S')}_{instance.post.id}_{instance.id}.{ext}"
    return os.path.join('posts', 'videos', filename)


class PostPrivacy(models.TextChoices):
    PUBLIC = 'public', 'Public'
    FRIENDS = 'friends', 'Friends Only'
    ONLY_ME = 'only_me', 'Only Me'
    CUSTOM = 'custom', 'Custom'


class PostStatus(models.TextChoices):
    PUBLISHED = 'published', 'Published'
    DRAFT = 'draft', 'Draft'
    ARCHIVED = 'archived', 'Archived'
    REPORTED = 'reported', 'Reported'
    DELETED = 'deleted', 'Deleted'


class PostType(models.TextChoices):
    TEXT = 'text', 'Text Post'
    IMAGE = 'image', 'Image Post'
    VIDEO = 'video', 'Video Post'
    LINK = 'link', 'Link Post'
    SHARE = 'share', 'Shared Post'


class Post(models.Model):
    """Main Post model"""
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts'
    )
    content = models.TextField(max_length=5000, blank=True, null=True)
    
    # Post metadata
    post_type = models.CharField(
        max_length=20,
        choices=PostType.choices,
        default=PostType.TEXT
    )
    privacy = models.CharField(
        max_length=20,
        choices=PostPrivacy.choices,
        default=PostPrivacy.PUBLIC
    )
    status = models.CharField(
        max_length=20,
        choices=PostStatus.choices,
        default=PostStatus.PUBLISHED
    )
    
    # For shared posts
    original_post = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shares'
    )
    share_message = models.TextField(max_length=500, blank=True, null=True)
    
    # Link preview data
    link_url = models.URLField(max_length=500, blank=True, null=True)
    link_title = models.CharField(max_length=200, blank=True, null=True)
    link_description = models.TextField(max_length=500, blank=True, null=True)
    link_image = models.URLField(max_length=500, blank=True, null=True)
    
    # Location data
    location_name = models.CharField(max_length=200, blank=True, null=True)
    location_lat = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=10, decimal_places=7, null=True, blank=True)
    
    # Feeling/Activity
    feeling = models.CharField(max_length=50, blank=True, null=True)
    feeling_emoji = models.CharField(max_length=10, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['privacy', 'status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['author', 'status']),
        ]
    
    def clean(self):
        # Validate that shared post has an original post
        if self.post_type == PostType.SHARE and not self.original_post:
            raise ValidationError("Shared post must have an original post")
        
        # Validate that link post has a URL
        if self.post_type == PostType.LINK and not self.link_url:
            raise ValidationError("Link post must have a URL")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    @property
    def like_count(self):
        return self.likes.filter(is_active=True).count()
    
    @property
    def comment_count(self):
        return self.comments.filter(is_active=True).count()
    
    @property
    def share_count(self):
        return self.shares.count()
    
    @property
    def has_media(self):
        return self.media.exists()
    
    @property
    def main_image(self):
        media = self.media.filter(media_type__in=['image', 'gif']).first()
        return media.file.url if media else None
    
    def can_view(self, user):
        """Check if a user can view this post"""
        if not user.is_authenticated:
            return self.privacy == PostPrivacy.PUBLIC
        
        if self.author == user:
            return True
        
        if self.privacy == PostPrivacy.PUBLIC:
            return True
        
        if self.privacy == PostPrivacy.FRIENDS:
            from friends.models import Friendship
            return Friendship.objects.filter(
                user=self.author, friend=user
            ).exists()
        
        if self.privacy == PostPrivacy.ONLY_ME:
            return False
        
        return False
    
    def __str__(self):
        return f"Post by {self.author.email} at {self.created_at}"


class PostMedia(models.Model):
    """Media attachments for posts"""
    MEDIA_TYPES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('gif', 'GIF'),
        ('audio', 'Audio'),
    ]
    
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='media'
    )
    file = models.FileField(
        upload_to=post_image_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm', 'mp3']
            )
        ]
    )
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)
    thumbnail = models.ImageField(upload_to='posts/thumbnails/', blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    file_size = models.PositiveIntegerField(blank=True, null=True)
    duration = models.PositiveIntegerField(blank=True, null=True, help_text="Duration in seconds for videos")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order']
    
    def save(self, *args, **kwargs):
        # Auto-detect media type from extension
        if not self.media_type:
            ext = self.file.name.split('.')[-1].lower()
            if ext in ['jpg', 'jpeg', 'png']:
                self.media_type = 'image'
            elif ext in ['gif']:
                self.media_type = 'gif'
            elif ext in ['mp4', 'mov', 'webm']:
                self.media_type = 'video'
            elif ext in ['mp3']:
                self.media_type = 'audio'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Media for post {self.post.id}"


class PostLike(models.Model):
    """Likes on posts"""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='post_likes'  # Changed from 'post_likes' to be unique
    )
    reaction_type = models.CharField(
        max_length=20,
        choices=[
            ('like', 'Like'),
            ('love', 'Love'),
            ('haha', 'Haha'),
            ('wow', 'Wow'),
            ('sad', 'Sad'),
            ('angry', 'Angry'),
        ],
        default='like'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['post', 'user']
    
    def __str__(self):
        return f"{self.user.email} {self.reaction_type} post {self.post.id}"


class Comment(models.Model):
    """Comments on posts"""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='post_comments'  # Changed from 'comments' to avoid conflict
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    content = models.TextField(max_length=2000)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', '-created_at']),
            models.Index(fields=['author', '-created_at']),
            models.Index(fields=['parent', '-created_at']),
        ]
    
    @property
    def like_count(self):
        return self.likes.filter(is_active=True).count()
    
    @property
    def reply_count(self):
        return self.replies.filter(is_active=True).count()
    
    def __str__(self):
        return f"Comment by {self.author.email} on post {self.post.id}"


class CommentLike(models.Model):
    """Likes on comments"""
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name='likes'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='post_comment_likes'  # Changed to unique name to avoid conflict with videos app
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['comment', 'user']
    
    def __str__(self):
        return f"{self.user.email} liked comment {self.comment.id}"


class PostSave(models.Model):
    """Saved posts (bookmarks)"""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='saved_by'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='saved_posts'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['post', 'user']
    
    def __str__(self):
        return f"{self.user.email} saved post {self.post.id}"


class PostReport(models.Model):
    """Reports for inappropriate posts"""
    REPORT_REASONS = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('hate_speech', 'Hate Speech'),
        ('violence', 'Violence'),
        ('nudity', 'Nudity'),
        ('fake_news', 'Fake News'),
        ('copyright', 'Copyright Infringement'),
        ('other', 'Other'),
    ]
    
    REPORT_STATUS = [
        ('pending', 'Pending Review'),
        ('reviewed', 'Reviewed'),
        ('action_taken', 'Action Taken'),
        ('dismissed', 'Dismissed'),
    ]
    
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='reports'
    )
    reporter = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='post_reports'  # Changed to unique name
    )
    reason = models.CharField(max_length=50, choices=REPORT_REASONS)
    description = models.TextField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=REPORT_STATUS, default='pending')
    admin_notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['post', 'reporter']
    
    def __str__(self):
        return f"Report on post {self.post.id} by {self.reporter.email}"