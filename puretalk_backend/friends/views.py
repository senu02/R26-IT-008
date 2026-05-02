from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count
from django.contrib.auth import get_user_model
from .models import FriendRequest, Friendship, FriendBlock
from .serializers import (
    FriendRequestSerializer, SendFriendRequestSerializer,
    FriendRequestActionSerializer,
    PendingRequestSerializer, SentRequestSerializer,
    BlockUserSerializer, UnblockUserSerializer, FriendSuggestionSerializer
)
from users.serializers import UserProfileSerializer

User = get_user_model()


class IsModeratorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_moderator


class FriendViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='send-request')
    def send_request(self, request):
        """Send a friend request to another user"""
        serializer = SendFriendRequestSerializer(
            data=request.data, 
            context={'request': request}
        )
        
        if serializer.is_valid():
            friend_request = FriendRequest.objects.create(
                from_user=request.user,
                to_user=serializer.target_user,
                message=serializer.validated_data.get('message', '')
            )
            
            response_serializer = FriendRequestSerializer(friend_request)
            return Response({
                'message': 'Friend request sent successfully',
                'data': response_serializer.data
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='accept-request')
    def accept_request(self, request):
        """Accept a pending friend request"""
        serializer = FriendRequestActionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            friend_request = serializer.friend_request
            friend_request.accept()
            
            return Response({
                'message': 'Friend request accepted',
                'friend': UserProfileSerializer(friend_request.from_user).data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='reject-request')
    def reject_request(self, request):
        """Reject a pending friend request"""
        serializer = FriendRequestActionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            friend_request = serializer.friend_request
            friend_request.reject()
            
            return Response({
                'message': 'Friend request rejected'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='pending-requests')
    def pending_requests(self, request):
        """Get all pending friend requests received by current user"""
        pending_requests = FriendRequest.objects.filter(
            to_user=request.user,
            status='pending'
        ).select_related('from_user')
        
        serializer = PendingRequestSerializer(pending_requests, many=True)
        return Response({
            'count': pending_requests.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='sent-requests')
    def sent_requests(self, request):
        """Get all sent friend requests by current user"""
        sent_requests = FriendRequest.objects.filter(
            from_user=request.user
        ).exclude(status='accepted').select_related('to_user')
        
        serializer = SentRequestSerializer(sent_requests, many=True)
        return Response({
            'count': sent_requests.count(),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='list')
    def friends_list(self, request):
        """Get all friends of the current user (both directions of friendship rows)."""
        as_owner = Friendship.objects.filter(user=request.user).select_related('friend')
        as_friend = Friendship.objects.filter(friend=request.user).select_related('user')

        other_by_id = {}
        for row in as_owner:
            other_by_id[row.friend_id] = row.friend
        for row in as_friend:
            other_by_id[row.user_id] = row.user

        results = []
        for friend_user in sorted(
            other_by_id.values(),
            key=lambda u: (u.get_full_name_display() or u.email or '').lower(),
        ):
            results.append(
                {
                    'id': friend_user.id,
                    'friend': friend_user.id,
                    'friend_detail': UserProfileSerializer(
                        friend_user, context={'request': request}
                    ).data,
                }
            )

        return Response({'count': len(results), 'results': results})
    
    @action(detail=False, methods=['get'], url_path='suggestions')
    def suggestions(self, request):
        """Get friend suggestions based on mutual friends"""
        user_friends = Friendship.objects.filter(user=request.user).values_list('friend_id', flat=True)
        
        # Base query
        potential_friends = User.objects.filter(
            is_active=True,
            account_status='active'
        ).exclude(
            id=request.user.id
        ).exclude(
            id__in=user_friends
        ).exclude(
            id__in=FriendBlock.objects.filter(blocker=request.user).values_list('blocked_id', flat=True)
        ).exclude(
            id__in=FriendBlock.objects.filter(blocked=request.user).values_list('blocker_id', flat=True)
        )
        
        # Role-based suggestions
        if request.user.role == 'user':
            # Regular users only get suggestions for other regular users
            potential_friends = potential_friends.filter(role='user')
        
        potential_friends = potential_friends.annotate(
            mutual_friends_count=Count(
                'friend_of__user',
                filter=Q(friend_of__user__in=user_friends)
            )
        ).filter(
            mutual_friends_count__gt=0
        ).order_by('-mutual_friends_count')[:20]
        
        results = []
        for user in potential_friends:
            mutual_friends = User.objects.filter(
                friend_of__user=request.user,
                friend_of__friend=user
            )[:5]
            
            results.append({
                'user': user,
                'mutual_friends_count': user.mutual_friends_count,
                'mutual_friends': mutual_friends
            })
        
        serializer = FriendSuggestionSerializer(results, many=True)
        return Response({
            'count': len(results),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['post'], url_path='block')
    def block_user(self, request):
        """Block a user"""
        serializer = BlockUserSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            # Delete any existing friendship
            Friendship.objects.filter(
                Q(user=request.user, friend=serializer.target_user) |
                Q(user=serializer.target_user, friend=request.user)
            ).delete()
            
            # Delete any pending friend requests
            FriendRequest.objects.filter(
                Q(from_user=request.user, to_user=serializer.target_user) |
                Q(from_user=serializer.target_user, to_user=request.user)
            ).delete()
            
            # Create block record
            FriendBlock.objects.create(
                blocker=request.user,
                blocked=serializer.target_user,
                reason=serializer.validated_data.get('reason', '')
            )
            
            return Response({
                'message': f'User has been blocked'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='unblock')
    def unblock_user(self, request):
        """Unblock a previously blocked user"""
        serializer = UnblockUserSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            serializer.block_record.delete()
            
            return Response({
                'message': 'User has been unblocked'
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='blocked-users')
    def blocked_users(self, request):
        """Get list of blocked users"""
        blocks = FriendBlock.objects.filter(
            blocker=request.user
        ).select_related('blocked')
        
        users = [block.blocked for block in blocks]
        serializer = UserProfileSerializer(users, many=True)
        
        return Response({
            'count': len(users),
            'results': serializer.data
        })
    
    @action(detail=False, methods=['delete'], url_path='remove-friend/(?P<friend_id>[^/.]+)')
    def remove_friend(self, request, friend_id=None):
        """Remove a friend (unfriend)"""
        try:
            # Check if friend exists
            friend = User.objects.get(id=friend_id)
            
            # Role-based check: Can't remove admin if you're regular user
            if request.user.role == 'user' and friend.role in ['admin', 'moderator', 'super_admin']:
                return Response({
                    'error': 'You cannot remove a moderator or admin from friends'
                }, status=status.HTTP_403_FORBIDDEN)
            
            deleted_count, _ = Friendship.objects.filter(
                Q(user=request.user, friend_id=friend_id) |
                Q(user_id=friend_id, friend=request.user)
            ).delete()
            
            if deleted_count == 0:
                return Response({
                    'error': 'User is not your friend'
                }, status=status.HTTP_404_NOT_FOUND)
            
            return Response({
                'message': 'Friend removed successfully'
            }, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='check-status/(?P<user_id>[^/.]+)')
    def check_friend_status(self, request, user_id=None):
        """Check the friendship status between current user and another user"""
        current_user = request.user
        
        try:
            other_user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if current_user.id == other_user.id:
            return Response({
                'status': 'self'
            })
        
        # Check if blocked
        if FriendBlock.objects.filter(blocker=current_user, blocked=other_user).exists():
            return Response({
                'status': 'blocked_by_me'
            })
        
        if FriendBlock.objects.filter(blocker=other_user, blocked=current_user).exists():
            return Response({
                'status': 'blocked_by_them'
            })
        
        # Check if friends
        if Friendship.objects.filter(user=current_user, friend=other_user).exists():
            return Response({
                'status': 'friends'
            })
        
        # Check for pending requests
        request_from_me = FriendRequest.objects.filter(
            from_user=current_user, to_user=other_user, status='pending'
        ).exists()
        
        if request_from_me:
            return Response({
                'status': 'request_sent_by_me'
            })
        
        request_to_me = FriendRequest.objects.filter(
            from_user=other_user, to_user=current_user, status='pending'
        ).exists()
        
        if request_to_me:
            return Response({
                'status': 'request_received_from_them'
            })
        
        return Response({
            'status': 'not_connected'
        })
    
    # Admin/Moderator specific actions
    @action(
        detail=False, 
        methods=['get'], 
        url_path='admin/all-requests',
        permission_classes=[IsModeratorOrAdmin]
    )
    def admin_all_requests(self, request):
        """Get all friend requests (admin only)"""
        if not request.user.can_manage_users():
            return Response({
                'error': 'You do not have permission to view all requests'
            }, status=status.HTTP_403_FORBIDDEN)
        
        requests = FriendRequest.objects.all().select_related('from_user', 'to_user')
        
        # Filter based on admin level
        if request.user.role == 'admin':
            requests = requests.exclude(
                Q(from_user__role='super_admin') | Q(to_user__role='super_admin')
            )
        
        serializer = FriendRequestSerializer(requests, many=True)
        return Response({
            'count': requests.count(),
            'results': serializer.data
        })
    
    @action(
        detail=False, 
        methods=['post'], 
        url_path='admin/block-user/(?P<user_id>[^/.]+)',
        permission_classes=[IsModeratorOrAdmin]
    )
    def admin_block_user(self, request, user_id=None):
        """Admin can block any user (except super admins)"""
        if not request.user.can_manage_users():
            return Response({
                'error': 'You do not have permission to block users'
            }, status=status.HTTP_403_FORBIDDEN)
        
        try:
            user_to_block = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                'error': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Prevent blocking higher roles
        if request.user.role == 'admin' and user_to_block.role == 'super_admin':
            return Response({
                'error': 'Cannot block super admin'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Block the user
        FriendBlock.objects.get_or_create(
            blocker=request.user,
            blocked=user_to_block,
            defaults={'reason': request.data.get('reason', 'Blocked by admin')}
        )
        
        # Remove any friendships
        Friendship.objects.filter(
            Q(user=user_to_block, friend=request.user) |
            Q(user=request.user, friend=user_to_block)
        ).delete()
        
        return Response({
            'message': f'User {user_to_block.email} has been blocked'
        })