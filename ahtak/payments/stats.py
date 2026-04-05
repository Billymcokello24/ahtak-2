"""
Aggregates for membership-related payments (registration, retention, welfare share, student).
Used by dashboard KPIs and Django admin (Membership page content).
"""
from decimal import Decimal

from django.db.models import DecimalField, ExpressionWrapper, F, Sum, Value

from payments.models import Payment

RETENTION_PAYMENT_TYPES = ("membership", "renewal")
STUDENT_MEMBERSHIP_PAYMENT_TYPES = ("registration", "membership", "renewal")


def _to_float(d):
    if d is None:
        return 0.0
    return float(d)


def get_membership_fee_stats():
    """
    Returns dict with counts and totals from recorded Payment rows.

    Welfare total uses MembershipPageContent: each retention payment contributes
    amount * (welfare_allocation / retention_fee) when retention_fee > 0.
    """
    from website.models import MembershipPageContent

    content = MembershipPageContent.get()
    retention_fee = content.retention_fee_kes_per_year or Decimal("0")
    welfare_alloc = content.retention_welfare_allocation_kes or Decimal("0")

    reg_qs = Payment.objects.filter(payment_type="registration").exclude(member_id__isnull=True)
    reg_members = reg_qs.values("member_id").distinct().count()
    reg_total = reg_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    reg_receipts = reg_qs.count()

    ret_qs = Payment.objects.filter(payment_type__in=RETENTION_PAYMENT_TYPES).exclude(
        member_id__isnull=True
    )
    ret_members = ret_qs.values("member_id").distinct().count()
    ret_total = ret_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    ret_receipts = ret_qs.count()

    welfare_total = Decimal("0")
    if retention_fee > 0 and welfare_alloc >= 0:
        welfare_total = (
            ret_qs.aggregate(
                w=Sum(
                    ExpressionWrapper(
                        F("amount") * Value(welfare_alloc) / Value(retention_fee),
                        output_field=DecimalField(max_digits=18, decimal_places=2),
                    )
                )
            )["w"]
            or Decimal("0")
        )

    stud_qs = Payment.objects.filter(
        payment_type__in=STUDENT_MEMBERSHIP_PAYMENT_TYPES,
        member__membership_type__kind="student",
    )
    stud_members = stud_qs.values("member_id").distinct().count()
    stud_total = stud_qs.aggregate(s=Sum("amount"))["s"] or Decimal("0")
    stud_receipts = stud_qs.count()

    return {
        "reference_fees_kes": {
            "registration": _to_float(content.registration_fee_kes),
            "retention_per_year": _to_float(content.retention_fee_kes_per_year),
            "welfare_allocation_per_retention": _to_float(content.retention_welfare_allocation_kes),
            "student_membership": _to_float(content.student_membership_fee_kes),
        },
        "registration_fee": {
            "members_paid_count": reg_members,
            "receipts_count": reg_receipts,
            "total_kes": _to_float(reg_total),
        },
        "retention_fee": {
            "members_paid_count": ret_members,
            "receipts_count": ret_receipts,
            "total_kes": _to_float(ret_total),
        },
        "welfare_from_retention": {
            "estimated_total_kes": _to_float(welfare_total),
            "note": "Sum over retention receipts: amount × (welfare allocation ÷ retention fee) from fees below.",
        },
        "student_membership": {
            "members_paid_count": stud_members,
            "receipts_count": stud_receipts,
            "total_kes": _to_float(stud_total),
        },
    }
