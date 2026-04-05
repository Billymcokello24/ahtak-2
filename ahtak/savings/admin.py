from django.contrib import admin
from .models import SavingsAccountType, SavingsAccount, SavingsTransaction


@admin.register(SavingsAccountType)
class SavingsAccountTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'interest_rate', 'min_balance', 'is_active')


@admin.register(SavingsAccount)
class SavingsAccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'member', 'account_type', 'balance', 'is_active')
    search_fields = ('account_number', 'member__member_number')


@admin.register(SavingsTransaction)
class SavingsTransactionAdmin(admin.ModelAdmin):
    list_display = ('account', 'transaction_type', 'amount', 'balance_after', 'created_at')
    list_filter = ('transaction_type',)
