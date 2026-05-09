from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from datetime import timedelta
from knox.models import AuthToken
from .serializers import (
    RegisterSerializer, LoginSerializer, UserProfileSerializer,
    AdminUserUpdateSerializer, UserSuspendSerializer, UserBanSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .permissions import IsAdmin, IsModerator, IsSuperAdmin, CanModerateContent

User = get_user_model()


class IsAdminOrSelf(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user.is_admin or obj == request.user


class LoginViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    
    def create(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        user = authenticate(request, email=email, password=password)
        
        if not user:
            return Response(
                {"error": "Invalid email or password"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check behavior profile suspension first
        try:
            from toxicity_behavior.models import UserBehaviorProfile
            bp, _ = UserBehaviorProfile.objects.get_or_create(user=user)
            
            # Sync behavior profile status with user account
            if bp.is_suspended and bp.suspended_until:
                if timezone.now() > bp.suspended_until:
                    # Expired suspension
                    bp.is_suspended = False
                    bp.suspended_until = None
                    bp.suspension_reason = None
                    bp.save()
                    if user.account_status == 'suspended':
                        user.account_status = 'active'
                        user.suspended_until = None
                        user.suspension_reason = None
                        user.save()
                else:
                    # Active suspension from behavior profile
                    if user.account_status != 'suspended':
                        user.account_status = 'suspended'
                        user.suspended_until = bp.suspended_until
                        user.suspension_reason = bp.suspension_reason
                        user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])
        except Exception as e:
            pass
        
        # Auto-clear expired suspension from user account
        if user.account_status == 'suspended' and user.suspended_until:
            if timezone.now() > user.suspended_until:
                user.account_status = 'active'
                user.suspended_until = None
                user.suspension_reason = None
                user.save(update_fields=['account_status', 'suspended_until', 'suspension_reason'])

        # Check account status
        if user.account_status == 'suspended':
            until_str = ""
            if user.suspended_until:
                until_str = f" until {user.suspended_until.strftime('%Y-%m-%d %H:%M UTC')}"
            reason_str = f" Reason: {user.suspension_reason}" if user.suspension_reason else ""
            return Response(
                {"error": f"⚠️ Your account has been suspended{until_str}.{reason_str}"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user.account_status == 'banned':
            reason_str = f" Reason: {user.banned_reason}" if user.banned_reason else ""
            return Response(
                {"error": f"⛔ Your account has been permanently banned.{reason_str}"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not user.is_active:
            return Response(
                {"error": "This account is disabled"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update last active
        user.last_active = timezone.now()
        user.save(update_fields=['last_active'])
        
        # Create token
        _, token = AuthToken.objects.create(user)
        
        # Get user data with behavior profile info
        user_data = UserProfileSerializer(user).data
        
        # Add behavior profile info
        try:
            from toxicity_behavior.services import get_user_status
            behavior_status = get_user_status(user)
            user_data['behavior_status'] = behavior_status
        except Exception:
            pass
        
        return Response({
            'user': user_data,
            'token': token,
            'role': user.role,
            'permissions': {
                'is_admin': user.is_admin,
                'is_moderator': user.is_moderator,
                'can_moderate': user.can_moderate()
            }
        }, status=status.HTTP_200_OK)


class RegisterView(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            _, token = AuthToken.objects.create(user)
            
            return Response({
                "message": "User registered successfully",
                "user": UserProfileSerializer(user).data,
                "token": token
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserView(viewsets.ModelViewSet):
    """View for user listing and profile management with role-based access"""
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    
    def get_serializer_class(self):
        if self.action in ['update_user_by_admin', 'partial_update_user_by_admin']:
            return AdminUserUpdateSerializer
        return UserProfileSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'super_admin':
            return User.objects.all()
        elif user.role == 'admin':
            return User.objects.exclude(role='super_admin')
        elif user.role == 'moderator':
            return User.objects.filter(role='user')
        else:
            return User.objects.filter(id=user.id)
    
    def list(self, request):
        if not request.user.can_manage_users() and not request.user.is_moderator:
            return Response(
                {"error": "You don't have permission to list all users"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        serializer = UserProfileSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'users': serializer.data
        })
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """Get current logged in user profile with behavior status"""
        serializer = UserProfileSerializer(request.user)
        data = serializer.data
        
        # Add behavior profile info
        try:
            from toxicity_behavior.services import get_user_status
            behavior_status = get_user_status(request.user)
            data['behavior_status'] = behavior_status
        except Exception as e:
            pass
        
        return Response(data)
    
    @action(detail=False, methods=['patch'], url_path='me')
    def update_me(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        
        if serializer.is_valid():
            updated_user = serializer.save()
            updated_user.last_active = timezone.now()
            updated_user.save(update_fields=['last_active'])
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['delete'], url_path='me')
    def delete_me(self, request):
        user = request.user
        
        password = request.data.get('password')
        if not password:
            return Response(
                {"error": "Password confirmation required to delete account"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(password):
            return Response(
                {"error": "Incorrect password"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_email = user.email
        user.delete()
        
        return Response(
            {"message": f"Your account ({user_email}) has been deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )
    
    @action(detail=True, methods=['post'], url_path='suspend')
    def suspend_user(self, request, pk=None):
        """Admin/Moderator: Suspend a user"""
        if not request.user.can_manage_users():
            return Response(
                {"error": "You don't have permission to suspend users"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if user.role == 'super_admin' or (user.role == 'admin' and request.user.role != 'super_admin'):
            return Response(
                {"error": "You cannot suspend this user"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSuspendSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        days = serializer.validated_data['days']
        reason = serializer.validated_data.get('reason', f'Manual suspension by {request.user.email}')
        suspended_until = timezone.now() + timedelta(days=days)
        
        # Update user account
        user.account_status = 'suspended'
        user.suspended_until = suspended_until
        user.suspension_reason = reason
        user.save()
        
        # Update behavior profile
        try:
            from toxicity_behavior.models import UserBehaviorProfile
            bp, _ = UserBehaviorProfile.objects.get_or_create(user=user)
            bp.is_suspended = True
            bp.suspended_until = suspended_until
            bp.suspension_reason = reason
            bp.save()
        except Exception as e:
            pass
        
        # Delete all auth tokens
        AuthToken.objects.filter(user=user).delete()
        
        return Response({
            "message": f"User {user.email} suspended for {days} days",
            "suspended_until": suspended_until
        })
    
    @action(detail=True, methods=['post'], url_path='unsuspend')
    def unsuspend_user(self, request, pk=None):
        """Admin/Moderator: Unsuspend a user"""
        if not request.user.can_manage_users():
            return Response(
                {"error": "You don't have permission to unsuspend users"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Update user account
        user.account_status = 'active'
        user.suspended_until = None
        user.suspension_reason = None
        user.save()
        
        # Update behavior profile
        try:
            from toxicity_behavior.models import UserBehaviorProfile
            bp, _ = UserBehaviorProfile.objects.get_or_create(user=user)
            bp.is_suspended = False
            bp.suspended_until = None
            bp.suspension_reason = None
            bp.save()
        except Exception as e:
            pass
        
        return Response({"message": f"User {user.email} has been unsuspended"})
    
    @action(detail=True, methods=['post'], url_path='ban')
    def ban_user(self, request, pk=None):
        """Admin only: Permanently ban a user"""
        if not request.user.can_manage_users() or request.user.role not in ['admin', 'super_admin']:
            return Response(
                {"error": "Only admins can ban users"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if user.role == 'super_admin' or (user.role == 'admin' and request.user.role != 'super_admin'):
            return Response(
                {"error": "You cannot ban this user"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserBanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user.account_status = 'banned'
        user.banned_at = timezone.now()
        user.banned_reason = serializer.validated_data['reason']
        user.save()
        
        AuthToken.objects.filter(user=user).delete()
        
        return Response({"message": f"User {user.email} has been banned"})
    
    @action(detail=True, methods=['post'], url_path='unban')
    def unban_user(self, request, pk=None):
        """Admin only: Unban a user"""
        if not request.user.can_manage_users() or request.user.role not in ['admin', 'super_admin']:
            return Response(
                {"error": "Only admins can unban users"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        user.account_status = 'active'
        user.banned_at = None
        user.banned_reason = None
        user.save()
        
        return Response({"message": f"User {user.email} has been unbanned"})
    
    @action(detail=True, methods=['put', 'patch'], url_path='role')
    def change_user_role(self, request, pk=None):
        if not request.user.can_manage_users() or request.user.role not in ['admin', 'super_admin']:
            return Response(
                {"error": "Only admins can change user roles"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        new_role = request.data.get('role')
        if new_role not in ['user', 'moderator', 'admin']:
            return Response(
                {"error": "Invalid role. Valid roles: user, moderator, admin"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if user.role == 'super_admin':
            return Response(
                {"error": "Cannot change super admin role"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if new_role == 'admin' and request.user.role != 'super_admin':
            return Response(
                {"error": "Only super admin can promote users to admin"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        old_role = user.role
        user.role = new_role
        user.save()
        
        return Response({
            "message": f"User {user.email} role changed from {old_role} to {new_role}"
        })
    
    @action(detail=True, methods=['post'], url_path='change-password')
    def change_password(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        
        if user != request.user and not request.user.can_manage_users():
            return Response(
                {"error": "You can only change your own password"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if user == request.user:
            old_password = request.data.get('old_password')
            new_password = request.data.get('new_password')
            confirm_password = request.data.get('confirm_password')
            
            if not all([old_password, new_password, confirm_password]):
                return Response(
                    {"error": "Old password, new password and confirm password are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not user.check_password(old_password):
                return Response({"error": "Old password is incorrect"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            new_password = request.data.get('new_password')
            confirm_password = request.data.get('confirm_password')
            
            if not all([new_password, confirm_password]):
                return Response(
                    {"error": "New password and confirm password are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if new_password != confirm_password:
            return Response({"error": "New passwords do not match"}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        AuthToken.objects.filter(user=user).delete()
        
        return Response(
            {"message": "Password changed successfully. Please login again with new password."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='moderators')
    def list_moderators(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        users = User.objects.filter(role__in=['moderator', 'admin', 'super_admin'])
        serializer = UserProfileSerializer(users, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='stats')
    def user_stats(self, request):
        if not request.user.can_manage_users():
            return Response(
                {"error": "Only admins can view user statistics"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        stats = {
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(account_status='active').count(),
            'suspended_users': User.objects.filter(account_status='suspended').count(),
            'banned_users': User.objects.filter(account_status='banned').count(),
            'by_role': {
                'user': User.objects.filter(role='user').count(),
                'moderator': User.objects.filter(role='moderator').count(),
                'admin': User.objects.filter(role='admin').count(),
                'super_admin': User.objects.filter(role='super_admin').count(),
            },
            'recent_users': UserProfileSerializer(
                User.objects.order_by('-date_joined')[:10], 
                many=True
            ).data
        }
        
        return Response(stats)