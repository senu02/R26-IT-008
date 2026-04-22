from django.contrib import admin
from django.contrib.auth import get_user_model
from django.utils.html import format_html
from django.utils import timezone
from .models import Video, VideoLike, VideoComment, CommentLike, VideoView, VideoReport

User = get_user_model()


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title_preview', 'privacy', 'views_count', 'likes_count', 'is_flagged', 'is_blocked', 'created_at']
    list_filter = ['privacy', 'allow_comments', 'created_at', 'is_flagged', 'is_blocked', 'user__role']
    search_fields = ['title', 'description', 'user__email']
    readonly_fields = ['views_count', 'likes_count', 'comments_count', 'shares_count']
    raw_id_fields = ['user']
    actions = ['flag_videos', 'block_videos', 'unblock_videos']
    
    def title_preview(self, obj):
        return obj.title[:50] + '...' if len(obj.title) > 50 else obj.title
    title_preview.short_description = 'Title'
    
    def flag_videos(self, request, queryset):
        if request.user.is_moderator:
            count = 0
            for video in queryset:
                if not video.is_flagged:
                    video.flag_for_moderation(reason='Flagged by admin')
                    count += 1
            self.message_user(request, f'{count} videos flagged for moderation.')
        else:
            self.message_user(request, 'You do not have permission to flag videos.', level='ERROR')
    flag_videos.short_description = 'Flag selected videos for moderation'
    
    def block_videos(self, request, queryset):
        if request.user.is_admin:
            count = 0
            for video in queryset:
                if not video.is_blocked:
                    video.block_video(reason='Blocked by admin', moderator=request.user)
                    count += 1
            self.message_user(request, f'{count} videos blocked.')
        else:
            self.message_user(request, 'Only admins can block videos.', level='ERROR')
    block_videos.short_description = 'Block selected videos'
    
    def unblock_videos(self, request, queryset):
        if request.user.is_admin:
            count = 0
            for video in queryset:
                if video.is_blocked:
                    video.unblock_video()
                    count += 1
            self.message_user(request, f'{count} videos unblocked.')
        else:
            self.message_user(request, 'Only admins can unblock videos.', level='ERROR')
    unblock_videos.short_description = 'Unblock selected videos'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(user__role='super_admin')
        if request.user.is_moderator:
            # Moderators can see flagged videos and user videos
            return qs.filter(Q(is_flagged=True) | Q(user__role='user'))
        return qs.filter(user=request.user)


@admin.register(VideoLike)
class VideoLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'user_role', 'video', 'created_at']
    list_filter = ['created_at', 'user__role']
    raw_id_fields = ['user', 'video']
    
    def user_role(self, obj):
        return obj.user.role
    user_role.short_description = 'User Role'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(user__role='super_admin')
        return qs.filter(user=request.user)


@admin.register(VideoComment)
class VideoCommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'user_role', 'video', 'content_preview', 'likes_count', 'created_at']
    list_filter = ['created_at', 'user__role']
    search_fields = ['content', 'user__email']
    raw_id_fields = ['user', 'video', 'parent']
    actions = ['delete_selected_comments']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    def user_role(self, obj):
        return obj.user.role
    user_role.short_description = 'User Role'
    
    def delete_selected_comments(self, request, queryset):
        if request.user.is_moderator:
            count = queryset.count()
            for comment in queryset:
                comment.video.decrement_comments()
            queryset.delete()
            self.message_user(request, f'{count} comments deleted.')
        else:
            self.message_user(request, 'You do not have permission to delete comments.', level='ERROR')
    delete_selected_comments.short_description = 'Delete selected comments (Moderators only)'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(user__role='super_admin')
        if request.user.is_moderator:
            return qs.filter(user__role='user')
        return qs.filter(user=request.user)


@admin.register(CommentLike)
class CommentLikeAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'user_role', 'comment', 'created_at']
    raw_id_fields = ['user', 'comment']
    
    def user_role(self, obj):
        return obj.user.role
    user_role.short_description = 'User Role'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(user__role='super_admin')
        return qs.filter(user=request.user)


@admin.register(VideoView)
class VideoViewAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_or_ip', 'video', 'viewed_at']
    list_filter = ['viewed_at']
    raw_id_fields = ['user', 'video']
    
    def user_or_ip(self, obj):
        return obj.user.email if obj.user else obj.ip_address
    user_or_ip.short_description = 'User/IP'
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs.exclude(user__role='super_admin')
        return qs.filter(user=request.user)


@admin.register(VideoReport)
class VideoReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'reporter', 'video', 'reason', 'created_at', 'resolved']
    list_filter = ['reason', 'resolved', 'created_at']
    actions = ['mark_as_resolved', 'block_video_and_resolve']
    
    def mark_as_resolved(self, request, queryset):
        if request.user.is_moderator:
            count = 0
            for report in queryset:
                if not report.resolved:
                    report.resolve(request.user)
                    count += 1
            self.message_user(request, f'{count} reports marked as resolved.')
        else:
            self.message_user(request, 'Only moderators can resolve reports.', level='ERROR')
    mark_as_resolved.short_description = "Mark selected reports as resolved"
    
    def block_video_and_resolve(self, request, queryset):
        if request.user.is_admin:
            count = 0
            for report in queryset:
                if not report.resolved:
                    report.video.block_video(reason=report.reason, moderator=request.user)
                    report.resolve(request.user)
                    count += 1
            self.message_user(request, f'{count} videos blocked and reports resolved.')
        else:
            self.message_user(request, 'Only admins can block videos.', level='ERROR')
    block_video_and_resolve.short_description = "Block video and resolve report (Admin only)"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_super_admin:
            return qs
        if request.user.is_admin:
            return qs
        if request.user.is_moderator:
            return qs.filter(video__user__role='user')
        return qs.filter(reporter=request.user)