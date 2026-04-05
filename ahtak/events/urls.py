from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EventViewSet, EventRegistrationViewSet, EventCheckInViewSet

router = DefaultRouter()
router.register(r'events', EventViewSet)
router.register(r'registrations', EventRegistrationViewSet)
router.register(r'check-ins', EventCheckInViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
