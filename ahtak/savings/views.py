from rest_framework import viewsets

from core.permissions import get_user_role, get_member_id
from .models import SavingsAccountType, SavingsAccount, SavingsTransaction
from .serializers import (
    SavingsAccountTypeSerializer,
    SavingsAccountSerializer,
    SavingsTransactionSerializer,
)


class SavingsAccountTypeViewSet(viewsets.ModelViewSet):
    queryset = SavingsAccountType.objects.filter(is_active=True)
    serializer_class = SavingsAccountTypeSerializer


class SavingsAccountViewSet(viewsets.ModelViewSet):
    queryset = SavingsAccount.objects.all()
    serializer_class = SavingsAccountSerializer
    filterset_fields = ['member', 'account_type', 'is_active']

    def get_queryset(self):
        qs = super().get_queryset()
        if get_user_role(self.request) == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(member_id=mid)
            return qs.none()
        return qs


class SavingsTransactionViewSet(viewsets.ModelViewSet):
    queryset = SavingsTransaction.objects.all()
    serializer_class = SavingsTransactionSerializer
    filterset_fields = ['account', 'transaction_type']

    def get_queryset(self):
        qs = super().get_queryset()
        if get_user_role(self.request) == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(account__member_id=mid)
            return qs.none()
        return qs
