from rest_framework import viewsets

from core.permissions import get_user_role, get_member_id
from .models import ContributionType, MonthlyContribution, ContributionPayment
from .serializers import ContributionTypeSerializer, MonthlyContributionSerializer, ContributionPaymentSerializer


class ContributionTypeViewSet(viewsets.ModelViewSet):
    queryset = ContributionType.objects.filter(is_active=True)
    serializer_class = ContributionTypeSerializer


class MonthlyContributionViewSet(viewsets.ModelViewSet):
    queryset = MonthlyContribution.objects.all()
    serializer_class = MonthlyContributionSerializer
    filterset_fields = ['member', 'contribution_type', 'period', 'paid']

    def get_queryset(self):
        qs = super().get_queryset()
        if get_user_role(self.request) == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(member_id=mid)
            return qs.none()
        return qs


class ContributionPaymentViewSet(viewsets.ModelViewSet):
    queryset = ContributionPayment.objects.all()
    serializer_class = ContributionPaymentSerializer
    filterset_fields = ['member', 'contribution_type', 'period']

    def get_queryset(self):
        qs = super().get_queryset()
        if get_user_role(self.request) == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(member_id=mid)
            return qs.none()
        return qs
