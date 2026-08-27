from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ImageToxicityViewSet

router = DefaultRouter()
router.register(r'toxicity-image', ImageToxicityViewSet, basename='toxicity-image')

urlpatterns = [
    path('', include(router.urls)),
]
