from django.db import models


class ContributionType(models.Model):
    """Welfare, Development, Building Fund, etc."""
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class MonthlyContribution(models.Model):
    """Auto-generated monthly contribution per member per type."""
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    contribution_type = models.ForeignKey(ContributionType, on_delete=models.CASCADE)
    period = models.DateField()  # First day of month e.g. 2025-03-01
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['member', 'contribution_type', 'period']
        ordering = ['-period', 'member']

    def __str__(self):
        return f"{self.member.member_number} - {self.contribution_type.code} - {self.period}"


class ContributionPayment(models.Model):
    """Record of payment against a monthly contribution."""
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE)
    contribution_type = models.ForeignKey(ContributionType, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.DateField()
    payment = models.OneToOneField(
        'payments.Payment',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='contribution_payment'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.member_number} - {self.amount} - {self.period}"
