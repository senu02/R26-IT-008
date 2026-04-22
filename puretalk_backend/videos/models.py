from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError
import os

def video_upload_path(instance, filename):
    """Generate upload path for video files"""
    return f'videos/{instance.user.id}/{timezone.now().strftime("%Y/%m/%d")}/{filename}'

def thumbnail_upload_path(instance, filename):
    """Generate upload path for thumbnails"""
    return f'thumbnails/{instance.user.id}/{timezone.now().strftime("%Y/%m/%d")}/{filename}'


class Video(models.Model):
    PRIVACY_CHOICES = [
        ('public', 'Public'),
        ('friends', 'Friends Only'),
        ('only_me', 'Only Me'),
    ]
    
    # Basic Info
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='videos')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    
    # Media Files
    video_file = models.FileField(upload_to=video_upload_path)
    thumbnail = models.ImageField(upload_to=thumbnail_upload_path, blank=True, null=True)
    
    # Privacy & Settings
    privacy = models.CharField(max_length=20, choices=PRIVACY_CHOICES, default='public')
    allow_comments = models.BooleanField(default=True)
    allow_sharing = models.BooleanField(default=True)
    
    # Statistics
    views_count = models.PositiveIntegerField(default=0)
    likes_count = models.PositiveIntegerField(default=0)
    comments_count = models.PositiveIntegerField(default=0)
    shares_count = models.PositiveIntegerField(default=0)
    
    # Duration (in seconds)
    duration = models.PositiveIntegerField(default=0, help_text="Video duration in seconds")
    
    # Moderation fields
    is_flagged = models.BooleanField(default=False)
    flagged_reason = models.TextField(blank=True, null=True)
    flagged_at = models.DateTimeField(blank=True, null=True)
    is_blocked = models.BooleanField(default=False)
    blocked_reason = models.TextField(blank=True, null=True)
    blocked_at = models.DateTimeField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['privacy', '-created_at']),
            models.Index(fields=['is_flagged', '-created_at']),
            models.Index(fields=['is_blocked', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.title[:50]}"
    
    @property
    def video_url(self):
        if self.video_file:
            return self.video_file.url
        return None
    
    @property
    def thumbnail_url(self):
        if self.thumbnail:
            return self.thumbnail.url
        return None
    
    def can_user_view(self, user):
        """Check if a user can view this video"""
        # Blocked videos cannot be viewed by anyone except admins
        if self.is_blocked:
            if user.is_authenticated and user.can_manage_users():
                return True
            return False
        
        # Super admin can view everything
        if user.is_authenticated and user.is_super_admin:
            return True
        
        # Video owner can always view
        if user.is_authenticated and self.user == user:
            return True
        
        if self.privacy == 'public':
            return True
        
        if self.privacy == 'friends' and user.is_authenticated:
            # Check if they are friends
            from friends.models import Friendship
            return Friendship.objects.filter(
                user=user, friend=self.user
            ).exists()
        
        # Moderators and admins can view flagged videos for moderation
        if user.is_authenticated and user.is_moderator and self.is_flagged:
            return True
        
        return False
    
    def can_user_edit(self, user):
        """Check if a user can edit this video"""
        if user.is_super_admin:
            return True
        if user.is_admin and self.user.role != 'super_admin':
            return True
        return self.user == user
    
    def can_user_delete(self, user):
        """Check if a user can delete this video"""
        if user.is_super_admin:
            return True
        if user.is_admin and self.user.role != 'super_admin':
            return True
        return self.user == user
    
    def increment_views(self):
        self.views_count += 1
        self.save(update_fields=['views_count'])
    
    def increment_likes(self):
        self.likes_count += 1
        self.save(update_fields=['likes_count'])
    
    def decrement_likes(self):
        if self.likes_count > 0:
            self.likes_count -= 1
            self.save(update_fields=['likes_count'])
    
    def increment_comments(self):
        self.comments_count += 1
        self.save(update_fields=['comments_count'])
    
    def decrement_comments(self):
        if self.comments_count > 0:
            self.comments_count -= 1
            self.save(update_fields=['comments_count'])
    
    def increment_shares(self):
        self.shares_count += 1
        self.save(update_fields=['shares_count'])
    
    def flag_for_moderation(self, reason=None):
        """Flag video for moderation review"""
        self.is_flagged = True
        self.flagged_reason = reason
        self.flagged_at = timezone.now()
        self.save(update_fields=['is_flagged', 'flagged_reason', 'flagged_at'])
    
    def block_video(self, reason=None, moderator=None):
        """Block video from being viewed"""
        self.is_blocked = True
        self.blocked_reason = reason
        self.blocked_at = timezone.now()
        self.save(update_fields=['is_blocked', 'blocked_reason', 'blocked_at'])
    
    def unblock_video(self):
        """Unblock video"""
        self.is_blocked = False
        self.blocked_reason = None
        self.blocked_at = None
        self.save(update_fields=['is_blocked', 'blocked_reason', 'blocked_at'])


class VideoLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='video_likes')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'video']
    
    def __str__(self):
        return f"{self.user.email} liked {self.video.title[:30]}"


class VideoComment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='video_comments')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    content = models.TextField(max_length=1000)
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.user.email} on {self.video.title[:30]}: {self.content[:50]}"
    
    def can_user_view(self, user):
        """Check if a user can view this comment"""
        return self.video.can_user_view(user)
    
    def can_user_delete(self, user):
        """Check if user can delete this comment"""
        if user.is_super_admin:
            return True
        if user.is_admin and self.user.role != 'super_admin':
            return True
        if user.is_moderator and self.user.role == 'user':
            return True
        return self.user == user
    
    def increment_likes(self):
        self.likes_count += 1
        self.save(update_fields=['likes_count'])
    
    def decrement_likes(self):
        if self.likes_count > 0:
            self.likes_count -= 1
            self.save(update_fields=['likes_count'])


class CommentLike(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(VideoComment, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'comment']
    
    def __str__(self):
        return f"{self.user.email} liked comment {self.comment.id}"


class VideoView(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='video_views')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='views')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    viewed_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['video', '-viewed_at']),
        ]
    
    def __str__(self):
        user_str = self.user.email if self.user else f"Anonymous ({self.ip_address})"
        return f"{user_str} viewed {self.video.title[:30]}"


class VideoReport(models.Model):
    REPORT_REASONS = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment or bullying'),
        ('hate_speech', 'Hate speech'),
        ('violence', 'Violent content'),
        ('nudity', 'Nudity or sexual content'),
        ('copyright', 'Copyright violation'),
        ('other', 'Other'),
    ]
    
    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='video_reports')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=50, choices=REPORT_REASONS)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_reports')
    
    class Meta:
        unique_together = ['reporter', 'video']
    
    def __str__(self):
        return f"{self.reporter.email} reported {self.video.title[:30]} for {self.reason}"
    
    def resolve(self, moderator):
        self.resolved = True
        self.resolved_at = timezone.now()
        self.resolved_by = moderator
        self.save()