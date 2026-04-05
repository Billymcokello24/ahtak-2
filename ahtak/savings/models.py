from django.db import models
from decimal import Decimal


class SavingsAccountType(models.Model):
    """Regular, Fixed Deposit, Emergency Fund."""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    min_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest_rate = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        help_text="Annual interest rate percentage"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class SavingsAccount(models.Model):
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        related_name="savings_accounts"
    )
    account_type = models.ForeignKey(
        SavingsAccountType,
        on_delete=models.PROTECT,
        related_name="accounts"
    )
    account_number = models.CharField(max_length=30, unique=True, editable=False)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    opened_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ["member", "account_type"]
        ordering = ["member", "account_type"]

    def __str__(self):
        return f"{self.account_number} - {self.member.member_number}"

    def save(self, *args, **kwargs):
        if not self.account_number:
            from django.db.models import Max
            from django.db.models.functions import Coalesce
            last = SavingsAccount.objects.aggregate(
                m=Coalesce(Max('id'), 0)
            )['m']
            self.account_number = f"SAV-{(last + 1):08d}"
        super().save(*args, **kwargs)


class SavingsTransaction(models.Model):
    TRANSACTION_TYPES = [("deposit", "Deposit"), ("withdrawal", "Withdrawal"), ("interest", "Interest")]
    account = models.ForeignKey(
        SavingsAccount,
        on_delete=models.CASCADE,
        related_name="transactions"
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="savings_transaction"
    )
    narration = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.account.account_number} - {self.transaction_type} - {self.amount}"
