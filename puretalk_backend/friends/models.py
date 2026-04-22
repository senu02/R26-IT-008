from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.exceptions import ValidationError

User = settings.AUTH_USER_MODEL


class FriendRequest(models.Model):
    """Model for tracking friend requests between users"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('blocked', 'Blocked'),
    ]
    
    from_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_friend_requests'
    )
    to_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='received_friend_requests'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    message = models.TextField(blank=True, null=True, help_text="Optional message with friend request")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['from_user', 'to_user']
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['from_user', 'status']),
            models.Index(fields=['to_user', 'status']),
        ]
    
    def clean(self):
        if self.from_user == self.to_user:
            raise ValidationError("You cannot send a friend request to yourself")
        
        # Role-based check: Admins/Moderators can send requests to anyone
        # But regular users have restrictions
        if self.from_user.role == 'user' and self.to_user.account_status != 'active':
            raise ValidationError("Cannot send request to inactive user")
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def accept(self):
        """Accept the friend request and create friendship"""
        if self.status == 'pending':
            self.status = 'accepted'
            self.save()
            # Create friendship record
            Friendship.objects.get_or_create(
                user=self.from_user,
                friend=self.to_user
            )
            Friendship.objects.get_or_create(
                user=self.to_user,
                friend=self.from_user
            )
            return True
        return False
    
    def reject(self):
        """Reject the friend request"""
        if self.status == 'pending':
            self.status = 'rejected'
            self.save()
            return True
        return False
    
    def block(self):
        """Block a user (reject and prevent future requests)"""
        if self.status == 'pending':
            self.status = 'blocked'
            self.save()
            return True
        return False
    
    def __str__(self):
        return f"{self.from_user.email} -> {self.to_user.email} ({self.status})"


class Friendship(models.Model):
    """Model representing an established friendship between two users"""
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='friendships'
    )
    friend = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='friend_of'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'friend']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} <-> {self.friend.email}"


class FriendBlock(models.Model):
    """Model for blocked users"""
    
    blocker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_users'
    )
    blocked = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ['blocker', 'blocked']
    
    def __str__(self):
        return f"{self.blocker.email} blocked {self.blocked.email}"