from django.contrib import admin
from .models import UserBehaviorProfile, BehaviorEvent, BehaviorPattern


@admin.register(UserBehaviorProfile)
class UserBehaviorProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'toxic_count', 'psychological_risk_score', 'psychological_pattern',
        'warning_level', 'severity_score', 'is_suspended', 'last_offence_at'
    ]
    list_filter = ['psychological_pattern', 'warning_level', 'is_suspended']
    search_fields = ['user__email', 'user__username']
    readonly_fields = [
        'effective_threshold_display', 'first_offence_at', 'last_offence_at', 
        'updated_at', 'psychological_risk_score', 'psychological_pattern',
        'impulsivity_score', 'malice_score', 'escalation_risk', 'recovery_score',
        'weighted_toxicity_score', 'severity_weighted_offenses'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'toxic_count', 'warning_count', 'blocked_count', 'severity_score')
        }),
        ('Psychological Profile', {
            'fields': (
                'psychological_risk_score', 'psychological_pattern',
                'impulsivity_score', 'malice_score', 'escalation_risk', 
                'recovery_score', 'weighted_toxicity_score', 'severity_weighted_offenses'
            ),
            'classes': ('wide',),
            'description': 'AI-powered psychological behavior analysis'
        }),
        ('Enforcement Status', {
            'fields': ('warning_level', 'is_suspended', 'suspended_until', 'suspension_reason')
        }),
        ('Timestamps', {
            'fields': ('first_offence_at', 'last_offence_at', 'updated_at')
        }),
    )

    def effective_threshold_display(self, obj):
        return f"{obj.get_effective_threshold():.0%}"
    effective_threshold_display.short_description = 'Effective Threshold'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(BehaviorEvent)
class BehaviorEventAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'event_type', 'content_type', 'toxicity_score', 
        'psych_risk_at_event', 'psych_pattern_at_event', 'created_at'
    ]
    list_filter = ['event_type', 'content_type', 'psych_pattern_at_event']
    search_fields = ['user__email', 'analysed_text']
    readonly_fields = [f.name for f in BehaviorEvent._meta.get_fields() if hasattr(f, 'name')]