from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SavingsAccountTypeViewSet, SavingsAccountViewSet, SavingsTransactionViewSet

router = DefaultRouter()
router.register(r'account-types', SavingsAccountTypeViewSet)
router.register(r'accounts', SavingsAccountViewSet)
router.register(r'transactions', SavingsTransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
