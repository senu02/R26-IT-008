from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import CustomUser, UserRole, AccountStatus


class CustomUserAdmin(UserAdmin):
    list_display = ('email', 'full_name', 'role', 'account_status', 'mobile_number', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'gender', 'date_joined', 'role', 'account_status')
    search_fields = ('email', 'full_name', 'mobile_number')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Role & Status', {
            'fields': ('role', 'account_status', 'suspended_until', 'suspension_reason', 'banned_at', 'banned_reason'),
            'classes': ('wide',)
        }),
        ('Personal Information', {
            'fields': ('full_name', 'birthday', 'gender', 'mobile_number', 'profile_picture', 'cover_image', 'bio')
        }),
        ('Professional Info', {
            'fields': ('work', 'education', 'website', 'relationship_status'),
            'classes': ('collapse',)
        }),
        ('Location', {
            'fields': ('country', 'city'),
            'classes': ('collapse',)
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined', 'last_active'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'full_name', 'mobile_number', 'role'),
        }),
    )
    
    actions = ['make_moderator', 'make_admin', 'suspend_users', 'activate_users', 'ban_users']
    
    def make_moderator(self, request, queryset):
        queryset.update(role=UserRole.MODERATOR)
    make_moderator.short_description = "Set selected users as Moderators"
    
    def make_admin(self, request, queryset):
        queryset.update(role=UserRole.ADMIN)
    make_admin.short_description = "Set selected users as Admins"
    
    def suspend_users(self, request, queryset):
        queryset.update(account_status=AccountStatus.SUSPENDED)
    suspend_users.short_description = "Suspend selected users"
    
    def activate_users(self, request, queryset):
        queryset.update(account_status=AccountStatus.ACTIVE)
    activate_users.short_description = "Activate selected users"
    
    def ban_users(self, request, queryset):
        queryset.update(account_status=AccountStatus.BANNED)
    ban_users.short_description = "Ban selected users"

admin.site.register(CustomUser, CustomUserAdmin)