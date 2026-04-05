from django.contrib import admin
from notifications.emails import send_welcome_email
from .models import MembershipType, Member, MemberDocument


@admin.register(MembershipType)
class MembershipTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'kind', 'annual_fee', 'validity_months', 'is_active')
    list_filter = ('kind', 'is_active')


@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('member_number', 'first_name', 'last_name', 'email', 'status', 'membership_expiry', 'date_joined')
    list_filter = ('status', 'membership_type')
    search_fields = ('member_number', 'first_name', 'last_name', 'email', 'kvb_number', 'phone')
    readonly_fields = ('member_number', 'date_joined')

    def save_model(self, request, obj, form, change):
        prev_status = None
        if change and obj.pk:
            prev_status = Member.objects.filter(pk=obj.pk).values_list('status', flat=True).first()
        super().save_model(request, obj, form, change)
        # Admin approvals often happen by changing status directly.
        # Keep linked auth account in sync so approved members can sign in.
        profile = getattr(obj, 'user_account', None)
        if not profile or not profile.user:
            return
        if obj.status == 'active' and not profile.user.is_active:
            profile.user.is_active = True
            profile.user.save(update_fields=['is_active'])
        if change and prev_status == 'pending' and obj.status == 'active' and obj.email:
            send_welcome_email(obj)


@admin.register(MemberDocument)
class MemberDocumentAdmin(admin.ModelAdmin):
    list_display = ('member', 'document_type', 'uploaded_at')
    list_filter = ('document_type',)
