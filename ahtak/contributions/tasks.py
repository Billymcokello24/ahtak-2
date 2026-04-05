from django.utils import timezone

from celery import shared_task
from .models import ContributionType, MonthlyContribution
from members.models import Member


@shared_task
def generate_monthly_contributions():
    """Generate MonthlyContribution records for the current month for all active members and active contribution types."""
    today = timezone.now().date()
    period = today.replace(day=1)
    types = list(ContributionType.objects.filter(is_active=True))
    members = list(Member.objects.filter(status='active'))
    created = 0
    for m in members:
        for ct in types:
            _, was_created = MonthlyContribution.objects.get_or_create(
                member=m,
                contribution_type=ct,
                period=period,
                defaults={'amount': ct.amount, 'paid': False},
            )
            if was_created:
                created += 1
    return {'period': str(period), 'created': created}
