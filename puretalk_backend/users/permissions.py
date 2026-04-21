from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_admin


class IsSuperAdmin(permissions.BasePermission):
    """Allow access only to super admin users"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_super_admin
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_super_admin


class IsModerator(permissions.BasePermission):
    """Allow access only to moderators and above"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_moderator
    
    def has_object_permission(self, request, view, obj):
        return request.user.is_authenticated and request.user.is_moderator


class CanModerateContent(permissions.BasePermission):
    """Allow access to users who can moderate content"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.can_moderate()