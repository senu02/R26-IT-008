from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FriendViewSet

router = DefaultRouter()
router.register('friends', FriendViewSet, basename='friends')

urlpatterns = [
    path('', include(router.urls)),
]