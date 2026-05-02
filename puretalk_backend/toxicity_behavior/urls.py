from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BehaviorViewSet, SNAViewSet

router = DefaultRouter()
router.register('behavior', BehaviorViewSet, basename='behavior')
router.register('behavior/sna', SNAViewSet, basename='sna')

urlpatterns = [
    path('', include(router.urls)),
]
