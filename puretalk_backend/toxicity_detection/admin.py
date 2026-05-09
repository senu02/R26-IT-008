from django.contrib import admin
from django.utils.html import format_html
from .models import ToxicityLog, UserToxicityProfile


@admin.register(ToxicityLog)
class ToxicityLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'content_type', 'author_link', 'toxicity_badge',
        'max_score_display', 'flagged_labels_display',
        'is_reviewed', 'overridden', 'created_at'
    ]
    list_filter = ['is_toxic', 'content_type', 'is_reviewed', 'overridden', 'created_at']
    search_fields = ['author__email', 'analysed_text', 'flagged_labels']
    readonly_fields = [
        'author', 'post', 'comment', 'content_type',
        'analysed_text', 'is_toxic', 'max_score',
        'label_scores', 'flagged_labels', 'created_at'
    ]
    actions = ['mark_reviewed', 'mark_overridden']

    fieldsets = (
        ('Content', {
            'fields': ('content_type', 'author', 'post', 'comment', 'analysed_text')
        }),
        ('AI Result', {
            'fields': ('is_toxic', 'max_score', 'label_scores', 'flagged_labels')
        }),
        ('Admin Review', {
            'fields': ('is_reviewed', 'reviewer', 'review_notes', 'overridden')
        }),
        ('Meta', {
            'fields': ('created_at',)
        }),
    )

    def author_link(self, obj):
        if obj.author:
            return format_html(
                '<a href="/admin/users/user/{}/change/">{}</a>',
                obj.author.id, obj.author.email
            )
        return '-'
    author_link.short_description = 'Author'

    def toxicity_badge(self, obj):
        if obj.is_toxic:
            return format_html(
                '<span style="color:white;background:#dc3545;padding:2px 8px;'
                'border-radius:4px;font-size:11px;">TOXIC</span>'
            )
        return format_html(
            '<span style="color:white;background:#28a745;padding:2px 8px;'
            'border-radius:4px;font-size:11px;">CLEAN</span>'
        )
    toxicity_badge.short_description = 'Status'

    def max_score_display(self, obj):
        score = obj.max_score
        color = '#dc3545' if score >= 0.7 else '#ffc107' if score >= 0.5 else '#28a745'
        return format_html(
            '<span style="color:{}; font-weight:bold;">{:.0%}</span>',
            color, score
        )
    max_score_display.short_description = 'Max Score'

    def flagged_labels_display(self, obj):
        if obj.flagged_labels:
            badges = ''.join(
                f'<span style="background:#ffc107;color:#000;padding:1px 5px;'
                f'border-radius:3px;font-size:10px;margin-right:2px;">{l}</span>'
                for l in obj.flagged_labels
            )
            return format_html(badges)
        return '-'
    flagged_labels_display.short_description = 'Flags'

    def mark_reviewed(self, request, queryset):
        queryset.update(is_reviewed=True, reviewer=request.user)
    mark_reviewed.short_description = "Mark selected as reviewed"

    def mark_overridden(self, request, queryset):
        queryset.update(is_reviewed=True, overridden=True, reviewer=request.user)
    mark_overridden.short_description = "Mark selected as overridden (false positive)"


@admin.register(UserToxicityProfile)
class UserToxicityProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'toxic_post_count', 'toxic_comment_count',
        'highest_toxicity_score', 'is_flagged', 'is_suspended', 'last_toxic_at'
    ]
    list_filter = ['is_flagged', 'is_suspended']
    search_fields = ['user__email']
    readonly_fields = [
        'user', 'total_posts_checked', 'toxic_post_count',
        'total_comments_checked', 'toxic_comment_count',
        'highest_toxicity_score', 'last_toxic_at', 'updated_at'
    ]
    actions = ['flag_users', 'unflag_users', 'suspend_users', 'unsuspend_users']

    def flag_users(self, request, queryset):
        queryset.update(is_flagged=True)
    flag_users.short_description = "Flag selected users"

    def unflag_users(self, request, queryset):
        queryset.update(is_flagged=False)
    unflag_users.short_description = "Unflag selected users"

    def suspend_users(self, request, queryset):
        queryset.update(is_suspended=True)
    suspend_users.short_description = "Suspend selected users"

    def unsuspend_users(self, request, queryset):
        queryset.update(is_suspended=False)
    unsuspend_users.short_description = "Unsuspend selected users"