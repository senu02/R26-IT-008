from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ToxicityViewSet

router = DefaultRouter()
router.register('toxicity', ToxicityViewSet, basename='toxicity')

urlpatterns = [
    path('', include(router.urls)),
]