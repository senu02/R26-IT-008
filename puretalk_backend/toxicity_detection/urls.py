from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ToxicityViewSet

router = DefaultRouter()
router.register('toxicity', ToxicityViewSet, basename='toxicity')

urlpatterns = [
    path('toxicity/check/', ToxicityViewSet.as_view({'post': 'check_text'}), name='toxicity-check-text-slash'),
    path('toxicity/check', ToxicityViewSet.as_view({'post': 'check_text'}), name='toxicity-check-text-noslash'),
    path('toxicity/check-audio/', ToxicityViewSet.as_view({'post': 'check_audio'}), name='toxicity-check-audio-slash'),
    path('toxicity/check-audio', ToxicityViewSet.as_view({'post': 'check_audio'}), name='toxicity-check-audio-noslash'),
    path('', include(router.urls)),
]