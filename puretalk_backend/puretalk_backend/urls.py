
from django.contrib import admin
from django.urls import path,include
from  knox import views as knox_views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
   # path('api/auth/', include('knox.urls')),
    path('logout/',knox_views.LogoutView.as_view(), name='knox_logout'),
    path('logoutall/',knox_views.LogoutAllView.as_view(), name='knox_logout'),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)