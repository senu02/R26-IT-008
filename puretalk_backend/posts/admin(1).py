from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import (
    Post, PostMedia, PostLike, Comment, CommentLike,
    PostSave, PostReport
)


class PostMediaInline(admin.TabularInline):
    model = PostMedia
    extra = 1
    fields = ['file', 'media_type', 'order', 'preview']
    readonly_fields = ['preview']
    
    def preview(self, obj):
        if obj.file:
            if obj.media_type in ['image', 'gif']:
                return format_html('<img src="{}" style="max-height: 100px;"/>', obj.file.url)
            return format_html('Video/Audio file')
        return '-'
    preview.short_description = 'Preview'


class CommentInline(admin.TabularInline):
    model = Comment
    extra = 0
    fields = ['author', 'content', 'created_at', 'is_active']
    readonly_fields = ['created_at']


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'author_info', 'post_type', 'content_preview',
        'like_count', 'comment_count', 'share_count',
        'privacy', 'status', 'created_at'
    ]
    list_filter = ['post_type', 'privacy', 'status', 'created_at', 'author__role']
    search_fields = ['author__email', 'author__full_name', 'content']
    readonly_fields = ['created_at', 'updated_at', 'like_count_display', 'comment_count_display']
    inlines = [PostMediaInline, CommentInline]
    actions = ['make_public', 'make_friends_only', 'delete_selected_posts', 'report_posts']
    
    fieldsets = (
        ('Post Information', {
            'fields': ('author', 'content', 'post_type', 'privacy', 'status')
        }),
        ('Share Information', {
            'fields': ('original_post', 'share_message'),
            'classes': ('collapse',)
        }),
        ('Link Preview', {
            'fields': ('link_url', 'link_title', 'link_description', 'link_image'),
            'classes': ('collapse',)
        }),
        ('Location & Feeling', {
            'fields': ('location_name', 'location_lat', 'location_lng', 'feeling', 'feeling_emoji'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'scheduled_for'),
            'classes': ('collapse',)
        }),
    )
    
    def author_info(self, obj):
        return format_html(
            '<strong>{}</strong><br/><span style="color: gray;">{}</span>',
            obj.author.full_name or obj.author.email,
            obj.author.role
        )
    author_info.short_description = 'Author'
    
    def content_preview(self, obj):
        if obj.content:
            return obj.content[:100] + ('...' if len(obj.content) > 100 else '')
        return '-'
    content_preview.short_description = 'Content'
    
    def like_count_display(self, obj):
        return obj.like_count
    like_count_display.short_description = 'Likes'
    
    def comment_count_display(self, obj):
        return obj.comment_count
    comment_count_display.short_description = 'Comments'
    
    def make_public(self, request, queryset):
        queryset.update(privacy='public')
    make_public.short_description = "Make posts public"
    
    def make_friends_only(self, request, queryset):
        queryset.update(privacy='friends')
    make_friends_only.short_description = "Make posts friends only"
    
    def delete_selected_posts(self, request, queryset):
        for post in queryset:
            post.status = 'deleted'
            post.save()
    delete_selected_posts.short_description = "Soft delete selected posts"
    
    def report_posts(self, request, queryset):
        queryset.update(status='reported')
    report_posts.short_description = "Mark posts as reported"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(author__role='super_admin')
        if request.user.is_moderator:
            return qs.filter(author__role='user')
        return qs.filter(author=request.user)


@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'media_type', 'file_preview', 'order', 'created_at']
    list_filter = ['media_type', 'created_at']
    search_fields = ['post__author__email', 'post__content']
    
    def file_preview(self, obj):
        if obj.file and obj.media_type in ['image', 'gif']:
            return format_html('<img src="{}" style="max-height: 50px;"/>', obj.file.url)
        return obj.file.name if obj.file else '-'
    file_preview.short_description = 'Preview'


@admin.register(PostLike)
class PostLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'user', 'reaction_type', 'created_at']
    list_filter = ['reaction_type', 'created_at']
    search_fields = ['post__author__email', 'user__email']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'author', 'content_preview', 'like_count', 'reply_count', 'created_at']
    list_filter = ['created_at', 'author__role']
    search_fields = ['author__email', 'content']
    actions = ['delete_comments', 'restore_comments']
    
    def content_preview(self, obj):
        return obj.content[:100] + ('...' if len(obj.content) > 100 else '')
    content_preview.short_description = 'Content'
    
    def delete_comments(self, request, queryset):
        queryset.update(is_active=False)
    delete_comments.short_description = "Soft delete comments"
    
    def restore_comments(self, request, queryset):
        queryset.update(is_active=True)
    restore_comments.short_description = "Restore comments"


@admin.register(PostReport)
class PostReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'reporter', 'reason', 'status', 'created_at']
    list_filter = ['reason', 'status', 'created_at']
    search_fields = ['post__author__email', 'reporter__email', 'description']
    actions = ['mark_reviewed', 'mark_action_taken', 'dismiss_reports']
    
    fieldsets = (
        ('Report Information', {
            'fields': ('post', 'reporter', 'reason', 'description')
        }),
        ('Admin Actions', {
            'fields': ('status', 'admin_notes')
        }),
    )
    
    def mark_reviewed(self, request, queryset):
        queryset.update(status='reviewed')
    mark_reviewed.short_description = "Mark as reviewed"
    
    def mark_action_taken(self, request, queryset):
        queryset.update(status='action_taken')
    mark_action_taken.short_description = "Mark as action taken"
    
    def dismiss_reports(self, request, queryset):
        queryset.update(status='dismissed')
    dismiss_reports.short_description = "Dismiss reports"


@admin.register(PostSave)
class PostSaveAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['post__author__email', 'user__email']