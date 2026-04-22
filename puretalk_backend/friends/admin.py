from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from .models import FriendRequest, Friendship, FriendBlock

User = get_user_model()


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'from_user', 'to_user', 'status', 'created_at', 'from_user_role', 'to_user_role')
    list_filter = ('status', 'created_at', 'from_user__role', 'to_user__role')
    search_fields = ('from_user__email', 'to_user__email')
    readonly_fields = ('created_at', 'updated_at')
    actions = ['accept_requests', 'reject_requests', 'block_requests']
    
    def from_user_role(self, obj):
        return obj.from_user.role
    from_user_role.short_description = 'From User Role'
    
    def to_user_role(self, obj):
        return obj.to_user.role
    to_user_role.short_description = 'To User Role'
    
    def accept_requests(self, request, queryset):
        if not request.user.is_admin:
            self.message_user(request, 'Only admins can accept requests in bulk', level='ERROR')
            return
        count = 0
        for friend_request in queryset:
            if friend_request.accept():
                count += 1
        self.message_user(request, f'{count} friend requests accepted.')
    accept_requests.short_description = 'Accept selected friend requests'
    
    def reject_requests(self, request, queryset):
        if not request.user.is_admin:
            self.message_user(request, 'Only admins can reject requests in bulk', level='ERROR')
            return
        count = 0
        for friend_request in queryset:
            if friend_request.reject():
                count += 1
        self.message_user(request, f'{count} friend requests rejected.')
    reject_requests.short_description = 'Reject selected friend requests'
    
    def block_requests(self, request, queryset):
        if not request.user.is_admin:
            self.message_user(request, 'Only admins can block requests in bulk', level='ERROR')
            return
        count = 0
        for friend_request in queryset:
            if friend_request.block():
                count += 1
        self.message_user(request, f'{count} friend requests blocked.')
    block_requests.short_description = 'Block selected friend requests'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(from_user__role='super_admin').exclude(to_user__role='super_admin')
        if request.user.is_moderator:
            return qs.filter(from_user__role='user', to_user__role='user')
        return qs.none()


@admin.register(Friendship)
class FriendshipAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'friend', 'user_role', 'friend_role', 'created_at')
    list_filter = ('created_at', 'user__role', 'friend__role')
    search_fields = ('user__email', 'friend__email')
    readonly_fields = ('created_at',)
    
    def user_role(self, obj):
        return obj.user.role
    user_role.short_description = 'User Role'
    
    def friend_role(self, obj):
        return obj.friend.role
    friend_role.short_description = 'Friend Role'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(user__role='super_admin').exclude(friend__role='super_admin')
        if request.user.is_moderator:
            return qs.filter(user__role='user', friend__role='user')
        return qs.filter(user=request.user)


@admin.register(FriendBlock)
class FriendBlockAdmin(admin.ModelAdmin):
    list_display = ('id', 'blocker', 'blocked', 'blocker_role', 'blocked_role', 'created_at')
    list_filter = ('created_at', 'blocker__role', 'blocked__role')
    search_fields = ('blocker__email', 'blocked__email')
    
    def blocker_role(self, obj):
        return obj.blocker.role
    blocker_role.short_description = 'Blocker Role'
    
    def blocked_role(self, obj):
        return obj.blocked.role
    blocked_role.short_description = 'Blocked Role'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(blocker__role='super_admin').exclude(blocked__role='super_admin')
        if request.user.is_moderator:
            return qs.filter(blocker__role='user', blocked__role='user')
        return qs.filter(blocker=request.user)