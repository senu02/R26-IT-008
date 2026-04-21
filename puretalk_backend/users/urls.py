from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from users.views import RegisterView, LoginViewSet, UserView

router = DefaultRouter()
router.register('register', RegisterView, basename='register')
router.register('login', LoginViewSet, basename='login')
router.register('users', UserView, basename='users')

urlpatterns = [
    path('users/me/', UserView.as_view({'get': 'me', 'patch': 'update_me', 'delete': 'delete_me'}), name='user-me'),
    path('users/stats/', UserView.as_view({'get': 'user_stats'}), name='user-stats'),
    path('users/moderators/', UserView.as_view({'get': 'list_moderators'}), name='list-moderators'),
]

urlpatterns += router.urls