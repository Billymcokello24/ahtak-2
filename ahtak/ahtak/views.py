from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Sum, Q

from core.permissions import get_user_role


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    from members.models import Member
    from events.models import Event, EventRegistration
    from payments.models import Payment
    from savings.models import SavingsAccount
    from contributions.models import MonthlyContribution

    today = timezone.now().date()
    month_start = today.replace(day=1)
    next_month = (month_start + timedelta(days=32)).replace(day=1)

    # Members
    active_members = Member.objects.filter(status="active").count()
    pending_approval = Member.objects.filter(status="pending").count()
    new_this_month = Member.objects.filter(date_joined__gte=month_start, date_joined__lt=next_month).count()
    expiring_30 = Member.objects.filter(
        membership_expiry__gte=today,
        membership_expiry__lte=today + timedelta(days=30),
        status="active"
    ).count()
    expiring_60 = Member.objects.filter(
        membership_expiry__gte=today,
        membership_expiry__lte=today + timedelta(days=60),
        status="active"
    ).count()
    expiring_90 = Member.objects.filter(
        membership_expiry__gte=today,
        membership_expiry__lte=today + timedelta(days=90),
        status="active"
    ).count()
    expired = Member.objects.filter(status="expired").count()

    # Events
    upcoming_events = Event.objects.filter(start_date__gte=timezone.now(), status="published").count()
    pending_event_payments = EventRegistration.objects.filter(paid=False).count()

    # Savings
    total_savings = SavingsAccount.objects.aggregate(s=Sum("balance"))["s"] or 0

    # Payments
    payments_today = Payment.objects.filter(payment_date=today).aggregate(s=Sum("amount"))["s"] or 0
    payments_this_month = Payment.objects.filter(
        payment_date__gte=month_start,
        payment_date__lt=next_month
    ).aggregate(s=Sum("amount"))["s"] or 0

    # Contribution defaulters (unpaid this month)
    contribution_defaulters = MonthlyContribution.objects.filter(
        period=month_start,
        paid=False
    ).values("member").distinct().count()

    role = get_user_role(request)
    staff_financial = role in ("super_admin", "admin", "loan_officer")

    payload = {
        "members": {
            "active": active_members,
            "pending_approval": pending_approval,
            "new_this_month": new_this_month,
            "expiring_30_days": expiring_30,
            "expiring_60_days": expiring_60,
            "expiring_90_days": expiring_90,
            "expired": expired,
        },
        "events": {
            "upcoming": upcoming_events,
            "registrations_pending_payment": pending_event_payments,
        },
        "savings": {"total_balance": float(total_savings)},
        "payments": {
            "today": float(payments_today),
            "this_month": float(payments_this_month),
        },
        "contributions": {"defaulters_this_month": contribution_defaulters},
    }

    if staff_financial:
        from payments.stats import get_membership_fee_stats

        payload["membership_fees"] = get_membership_fee_stats()

    return Response(payload)
