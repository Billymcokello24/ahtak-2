from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContributionTypeViewSet, MonthlyContributionViewSet, ContributionPaymentViewSet

router = DefaultRouter()
router.register(r'types', ContributionTypeViewSet)
router.register(r'monthly', MonthlyContributionViewSet)
router.register(r'payments', ContributionPaymentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
