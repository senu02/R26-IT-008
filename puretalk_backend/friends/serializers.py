from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import FriendRequest, Friendship, FriendBlock
from users.serializers import UserProfileSerializer

User = get_user_model()


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user_detail = UserProfileSerializer(source='from_user', read_only=True)
    to_user_detail = UserProfileSerializer(source='to_user', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = [
            'id', 'from_user', 'to_user', 'from_user_detail', 'to_user_detail',
            'status', 'message', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'from_user', 'status', 'created_at', 'updated_at']


class SendFriendRequestSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    message = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_user_id(self, value):
        current_user = self.context['request'].user
        
        try:
            self.target_user = User.objects.get(id=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        
        if current_user.id == value:
            raise serializers.ValidationError("You cannot send a friend request to yourself")
        
        # Role-based validations
        if current_user.role == 'user':
            # Regular users can only send to active users
            if self.target_user.account_status != 'active':
                raise serializers.ValidationError("Cannot send request to this user")
            
            # Regular users have limit on pending requests
            pending_count = FriendRequest.objects.filter(
                from_user=current_user, 
                status='pending'
            ).count()
            
            if pending_count >= 20:  # Max 20 pending requests
                raise serializers.ValidationError("You have too many pending friend requests")
        
        # Check if already friends
        if Friendship.objects.filter(user=current_user, friend=self.target_user).exists():
            raise serializers.ValidationError("You are already friends with this user")
        
        # Check if request already exists
        if FriendRequest.objects.filter(
            from_user=current_user, 
            to_user=self.target_user,
            status='pending'
        ).exists():
            raise serializers.ValidationError("Friend request already sent")
        
        # Check if target user has blocked current user
        if FriendBlock.objects.filter(blocker=self.target_user, blocked=current_user).exists():
            raise serializers.ValidationError("You cannot send a friend request to this user")
        
        # Check if current user has blocked target user
        if FriendBlock.objects.filter(blocker=current_user, blocked=self.target_user).exists():
            raise serializers.ValidationError("You have blocked this user")
        
        return value


class FriendRequestActionSerializer(serializers.Serializer):
    request_id = serializers.IntegerField(required=True)
    
    def validate_request_id(self, value):
        try:
            self.friend_request = FriendRequest.objects.get(
                id=value, 
                to_user=self.context['request'].user,
                status='pending'
            )
        except FriendRequest.DoesNotExist:
            raise serializers.ValidationError("Friend request not found or already processed")
        return value


class FriendListSerializer(serializers.ModelSerializer):
    friend_detail = UserProfileSerializer(source='friend', read_only=True)
    
    class Meta:
        model = Friendship
        fields = ['id', 'friend', 'friend_detail', 'created_at']


class PendingRequestSerializer(serializers.ModelSerializer):
    from_user_detail = UserProfileSerializer(source='from_user', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'from_user', 'from_user_detail', 'message', 'created_at']


class SentRequestSerializer(serializers.ModelSerializer):
    to_user_detail = UserProfileSerializer(source='to_user', read_only=True)
    
    class Meta:
        model = FriendRequest
        fields = ['id', 'to_user', 'to_user_detail', 'message', 'status', 'created_at']


class BlockUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    reason = serializers.CharField(required=False, allow_blank=True)
    
    def validate_user_id(self, value):
        current_user = self.context['request'].user
        
        if current_user.id == value:
            raise serializers.ValidationError("You cannot block yourself")
        
        try:
            self.target_user = User.objects.get(id=value, is_active=True)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")
        
        # Role-based: Can't block admins if you're a regular user
        if current_user.role == 'user' and self.target_user.role in ['admin', 'moderator', 'super_admin']:
            raise serializers.ValidationError("You cannot block a moderator or admin")
        
        # Check if already blocked
        if FriendBlock.objects.filter(blocker=current_user, blocked=self.target_user).exists():
            raise serializers.ValidationError("User is already blocked")
        
        return value


class UnblockUserSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    
    def validate_user_id(self, value):
        current_user = self.context['request'].user
        
        try:
            self.block_record = FriendBlock.objects.get(blocker=current_user, blocked_id=value)
        except FriendBlock.DoesNotExist:
            raise serializers.ValidationError("User is not blocked")
        
        return value


class FriendSuggestionSerializer(serializers.Serializer):
    user = UserProfileSerializer()
    mutual_friends_count = serializers.IntegerField()
    mutual_friends = UserProfileSerializer(many=True)