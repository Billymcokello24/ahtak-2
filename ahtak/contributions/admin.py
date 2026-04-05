from django.contrib import admin
from .models import ContributionType, MonthlyContribution, ContributionPayment

# Register your models here.
@admin.register(ContributionType)
class ContributionTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'amount', 'is_active')

@admin.register(MonthlyContribution)
class MonthlyContributionAdmin(admin.ModelAdmin):
    list_display = ('member', 'contribution_type', 'period', 'amount', 'paid', 'paid_at')
    list_filter = ('contribution_type', 'period', 'paid')

@admin.register(ContributionPayment)
class ContributionPaymentAdmin(admin.ModelAdmin):
    list_display = ('member', 'contribution_type', 'amount', 'period', 'payment', 'created_at')
