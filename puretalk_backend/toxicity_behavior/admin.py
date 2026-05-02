from django.contrib import admin
from .models import UserBehaviorProfile, BehaviorEvent


@admin.register(UserBehaviorProfile)
class UserBehaviorProfileAdmin(admin.ModelAdmin):
    list_display  = ['user', 'toxic_count', 'warning_level', 'severity_score', 'is_suspended', 'last_offence_at']
    list_filter   = ['warning_level', 'is_suspended']
    search_fields = ['user__email', 'user__username']
    readonly_fields = ['effective_threshold_display', 'first_offence_at', 'last_offence_at', 'updated_at']

    def effective_threshold_display(self, obj):
        return f"{obj.get_effective_threshold():.0%}"
    effective_threshold_display.short_description = 'Effective Threshold'


@admin.register(BehaviorEvent)
class BehaviorEventAdmin(admin.ModelAdmin):
    list_display  = ['user', 'event_type', 'content_type', 'toxicity_score', 'threshold_used', 'created_at']
    list_filter   = ['event_type', 'content_type']
    search_fields = ['user__email', 'analysed_text']
    readonly_fields = [f.name for f in BehaviorEvent._meta.get_fields() if hasattr(f, 'name')]
