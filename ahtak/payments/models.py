from django.db import models


class Payment(models.Model):
    PAYMENT_TYPES = [
        ("registration", "Registration Fee"),
        ("membership", "Membership Fee"),
        ("renewal", "Membership Renewal"),
        ("event", "Event Registration Fee"),
        ("savings_deposit", "Savings Deposit"),
        ("savings_withdrawal", "Savings Withdrawal"),
        ("share_purchase", "Share Capital Purchase"),
        ("share_redemption", "Share Redemption"),
        ("contribution", "Monthly Contribution"),
        ("penalty", "Penalty/Fine"),
        ("other", "Other"),
    ]
    METHOD_CHOICES = [
        ("cash", "Cash"),
        ("mpesa", "M-Pesa"),
    ]

    receipt_number = models.CharField(max_length=20, unique=True, editable=False)
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="payments"
    )
    payment_type = models.CharField(max_length=50, choices=PAYMENT_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    transaction_code = models.CharField(max_length=50, blank=True)
    narration = models.TextField(blank=True)
    payment_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Optional links for automatic linking
    event_registration = models.ForeignKey(
        "events.EventRegistration",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments"
    )
    savings_account = models.ForeignKey(
        "savings.SavingsAccount",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="payments"
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        payer = self.member.member_number if self.member else "GUEST"
        return f"{self.receipt_number} - {payer} - {self.amount}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            from django.db.models import Max
            from django.db.models.functions import Coalesce
            last = Payment.objects.aggregate(
                m=Coalesce(Max('id'), 0)
            )['m']
            self.receipt_number = f"RCP-{(last + 1):06d}"
        if not self.payment_date:
            from django.utils import timezone
            self.payment_date = timezone.now().date()
        super().save(*args, **kwargs)


class PendingMpesaTransaction(models.Model):
    """Stores STK push request for callback matching. Deleted after successful payment creation."""
    checkout_request_id = models.CharField(max_length=100, unique=True, db_index=True)
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="pending_mpesa_transactions"
    )
    event_registration = models.ForeignKey(
        "events.EventRegistration",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="pending_mpesa_transactions"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
