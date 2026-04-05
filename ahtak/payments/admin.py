from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'payer_display', 'payment_type', 'event_ticket_display', 'amount', 'method', 'payment_date', 'created_at')
    list_filter = ('payment_type', 'method', 'member__membership_type__kind')
    search_fields = (
        'receipt_number',
        'member__member_number',
        'member__first_name',
        'member__last_name',
        'event_registration__ticket_number',
        'event_registration__guest_name',
        'transaction_code',
    )
    readonly_fields = ('receipt_number',)

    @admin.display(description='Payer')
    def payer_display(self, obj):
        if obj.member:
            return obj.member.member_number
        if obj.event_registration and obj.event_registration.is_guest:
            return obj.event_registration.guest_name or 'Guest'
        return 'N/A'

    @admin.display(description='Event Ticket')
    def event_ticket_display(self, obj):
        return obj.event_registration.ticket_number if obj.event_registration else '-'
