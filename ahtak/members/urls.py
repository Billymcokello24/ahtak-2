from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MembershipTypeViewSet, MemberViewSet, MemberDocumentViewSet

router = DefaultRouter()
router.register(r'membership-types', MembershipTypeViewSet)
router.register(r'members', MemberViewSet)
router.register(r'documents', MemberDocumentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
