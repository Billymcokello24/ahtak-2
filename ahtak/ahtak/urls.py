from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.views.generic import RedirectView
from django.urls import path, include
from .views import dashboard_kpis
from core.views import auth_token, current_user
from members.views import MemberRegisterView

admin.site.site_header = "Animal Health Technicians and Technologists Association (AHTTAK)"
admin.site.site_title = "AHTTAK Admin"
admin.site.index_title = "Administration"

urlpatterns = [
    path('', RedirectView.as_view(url=settings.FRONTEND_URL, permanent=False)),
    path('admin/', admin.site.urls),
    path('api/auth/token/', auth_token),
    path('api/auth/me/', current_user),
    path('api/dashboard/kpis/', dashboard_kpis),
    path('api/public/register/', MemberRegisterView.as_view({'post': 'create'})),
    path('api/', include('members.urls')),
    path('api/', include('events.urls')),
    path('api/', include('payments.urls')),
    path('api/', include('savings.urls')),
    path('api/contributions/', include('contributions.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/public/', include('website.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
