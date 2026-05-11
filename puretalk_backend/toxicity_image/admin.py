from django.contrib import admin
from .models import ImageToxicityLog


@admin.register(ImageToxicityLog)
class ImageToxicityLogAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'author', 'content_type', 'is_toxic',
        'confidence_score', 'model_available',
        'is_reviewed', 'overridden', 'created_at'
    ]
    list_filter = ['is_toxic', 'content_type', 'is_reviewed', 'overridden', 'model_available']
    search_fields = ['author__username', 'author__email']
    readonly_fields = [
        'is_toxic', 'confidence_score', 'toxic_probability',
        'non_toxic_probability', 'model_available', 'created_at'
    ]
    ordering = ['-created_at']

    fieldsets = (
        ('Image & Author', {
            'fields': ('author', 'post', 'content_type', 'image')
        }),
        ('ML Result', {
            'fields': (
                'is_toxic', 'confidence_score',
                'toxic_probability', 'non_toxic_probability',
                'model_available'
            )
        }),
        ('Admin Review', {
            'fields': ('is_reviewed', 'reviewer', 'review_notes', 'overridden')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )
