from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentViewSet,
    mpesa_stk_push,
    mpesa_callback,
    verify_receipt,
    public_receipt_pdf,
    public_guest_mpesa_stk_push,
    public_event_payment_status,
    public_guest_paybill_confirm,
    member_event_paybill_confirm,
)

router = DefaultRouter()
router.register(r'payments', PaymentViewSet)

urlpatterns = [
    path('payments/verify/<str:receipt_number>/', verify_receipt),
    path('payments/receipt/<str:receipt_number>/pdf/', public_receipt_pdf),
    path('payments/public/event-payment/<str:ticket_number>/', public_event_payment_status),
    path('payments/public/guest/stk-push/', public_guest_mpesa_stk_push),
    path('payments/public/guest/paybill-confirm/', public_guest_paybill_confirm),
    path('payments/member/event/paybill-confirm/', member_event_paybill_confirm),
    path('', include(router.urls)),
    path('mpesa/stk-push/', mpesa_stk_push),
    path('mpesa/callback/', mpesa_callback),
]
