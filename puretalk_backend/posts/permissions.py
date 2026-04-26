from rest_framework import permissions


class IsAuthorOrReadOnly(permissions.BasePermission):
    """Allow read access to everyone, but only author can modify"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user


class CanModeratePost(permissions.BasePermission):
    """Check if user can moderate posts"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_moderate()
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.can_moderate()


class CanDeleteAnyPost(permissions.BasePermission):
    """Users can delete own posts, moderators can delete any post, admins can delete any"""
    def has_object_permission(self, request, view, obj):
        if request.user == obj.author:
            return True
        if request.user.is_moderator:
            return True
        return False


class CanViewPost(permissions.BasePermission):
    """Check if user can view a specific post"""
    def has_object_permission(self, request, view, obj):
        return obj.can_view(request.user)