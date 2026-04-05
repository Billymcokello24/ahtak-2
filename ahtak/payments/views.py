import json
import logging
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from rest_framework.exceptions import PermissionDenied, ValidationError, NotFound
from core.permissions import get_user_role, get_member_id, role_can_access
from core.pdf_utils import receipt_pdf
from notifications.emails import get_payment_receipt_recipient, send_payment_receipt_email
from .models import Payment, PendingMpesaTransaction
from .serializers import PaymentSerializer

logger = logging.getLogger(__name__)


def _sync_after_event_payment(payment: Payment):
    reg = payment.event_registration
    if reg and not reg.paid:
        reg.paid = True
        reg.paid_at = timezone.now()
        reg.save(update_fields=['paid', 'paid_at'])


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    filterset_fields = ['member', 'payment_type', 'method', 'event_registration']
    search_fields = ['receipt_number', 'transaction_code']

    def perform_create(self, serializer):
        if not role_can_access(get_user_role(self.request), 'payments', 'write'):
            raise PermissionDenied('Only staff can record payments.')
        payment = serializer.save()

        # Keep event ticket payment status in sync.
        if payment.event_registration and not payment.event_registration.paid:
            payment.event_registration.paid = True
            payment.event_registration.paid_at = timezone.now()
            payment.event_registration.save(update_fields=['paid', 'paid_at'])

        # Keep membership state in sync when registration/renewal is paid.
        if payment.member and payment.payment_type in {'registration', 'membership', 'renewal'}:
            member = payment.member
            today = timezone.now().date()
            base_date = member.membership_expiry if member.membership_expiry and member.membership_expiry > today else today
            validity_months = getattr(member.membership_type, 'validity_months', 12) or 12
            member.membership_expiry = base_date + relativedelta(months=validity_months)
            if member.status != 'active':
                member.status = 'active'
            member.save(update_fields=['membership_expiry', 'status'])

        send_payment_receipt_email(payment)

    def get_queryset(self):
        qs = super().get_queryset()
        if get_user_role(self.request) == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(member_id=mid)
            return qs.none()
        return qs

    @action(detail=True, methods=['get'])
    def receipt_pdf(self, request, pk=None):
        """Download receipt as PDF."""
        payment = self.get_object()
        buf = receipt_pdf(payment)
        response = HttpResponse(buf.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="receipt_{payment.receipt_number}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def email_receipt(self, request, pk=None):
        """Email receipt PDF to member."""
        payment = self.get_object()
        recipient_email, _ = get_payment_receipt_recipient(payment)
        if not recipient_email:
            raise ValidationError('No recipient email found for this receipt.')
        if not send_payment_receipt_email(payment):
            raise ValidationError('Could not send receipt email.')
        return Response({'detail': 'Receipt emailed.'})


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_receipt(request, receipt_number):
    """
    Public endpoint to verify a receipt by number.
    Returns limited, non-sensitive details for scan-to-verify.
    """
    payment = Payment.objects.filter(receipt_number=receipt_number.strip().upper()).select_related('member', 'event_registration__event').first()
    if not payment:
        raise NotFound('Receipt not found')
    pay_date = payment.payment_date or (payment.created_at.date() if payment.created_at else None)
    pay_time = payment.created_at.strftime('%H:%M:%S') if payment.created_at else None
    member_name = None
    member_number = None
    if payment.member:
        member_number = payment.member.member_number
        member_name = f"{payment.member.first_name} {payment.member.last_name}".strip()
    elif payment.event_registration and payment.event_registration.is_guest:
        member_number = "GUEST"
        member_name = payment.event_registration.guest_name or "Guest attendee"

    payment_type_label = {
        "event": "Event",
        "membership": "Membership",
        "renewal": "Membership Renewal",
        "registration": "Membership Registration",
    }.get(payment.payment_type, payment.get_payment_type_display())

    return Response({
        'receipt_number': payment.receipt_number,
        'status': 'PAID',
        'date': str(pay_date) if pay_date else None,
        'time': pay_time,
        'amount': str(payment.amount),
        'currency': 'KES',
        'payment_type': payment_type_label,
        'method': payment.get_method_display(),
        'event_title': payment.event_registration.event.title if payment.event_registration and payment.event_registration.event else None,
        'member_number': member_number,
        'member_name': member_name,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_receipt_pdf(request, receipt_number):
    """Public receipt PDF download by receipt number."""
    payment = Payment.objects.filter(receipt_number=receipt_number.strip().upper()).first()
    if not payment:
        raise NotFound('Receipt not found')
    buf = receipt_pdf(payment)
    response = HttpResponse(buf.getvalue(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="receipt_{payment.receipt_number}.pdf"'
    return response


@api_view(['POST'])
def mpesa_stk_push(request):
    """
    Initiate M-Pesa STK push for event registration payment.
    Body: { phone_number, event_registration_id }
    Member must be logged in; event_registration must belong to their member or they must have staff access.
    """
    from payments.mpesa import stk_push
    from events.models import EventRegistration
    from members.models import Member

    phone_number = request.data.get('phone_number', '').strip()
    event_registration_id = request.data.get('event_registration_id')
    if not phone_number or not event_registration_id:
        raise ValidationError('phone_number and event_registration_id are required')

    try:
        reg = EventRegistration.objects.get(pk=event_registration_id)
    except EventRegistration.DoesNotExist:
        raise ValidationError('Event registration not found')

    if reg.paid:
        raise ValidationError('This registration is already paid')

    role = get_user_role(request)
    member_id = get_member_id(request)

    # Member can only pay for their own registration; staff can pay for any
    if role == 'member':
        if not reg.member_id or reg.member_id != member_id:
            raise PermissionDenied('You can only pay for your own registration')
        member = reg.member
    else:
        if not role_can_access(role, 'payments', 'write'):
            raise PermissionDenied('You do not have permission to initiate payments')
        # For staff paying for a registration, we need the member (or guest - use reg member if guest has no member)
        member = reg.member
        if not member:
            raise ValidationError('Guest registrations cannot use M-Pesa. Pay with cash and record in admin.')

    amount = float(reg.amount_payable or 0)
    if amount <= 0:
        raise ValidationError('No amount to pay')

    try:
        result = stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=f"EVT{reg.id}",
            transaction_desc=f"Event {reg.event_id}",
        )
    except Exception as e:
        logger.exception('M-Pesa STK push failed')
        raise ValidationError(str(e))

    checkout_id = result.get('CheckoutRequestID') or result.get('MerchantRequestID')
    if not checkout_id:
        raise ValidationError(result.get('errorMessage', 'M-Pesa request failed'))

    PendingMpesaTransaction.objects.create(
        checkout_request_id=checkout_id,
        member=member,
        event_registration=reg,
        amount=reg.amount_payable,
        phone_number=phone_number,
    )
    return Response({
        'detail': 'M-Pesa prompt sent to your phone. Enter your PIN to complete payment.',
        'CheckoutRequestID': checkout_id,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def public_event_payment_status(request, ticket_number):
    """
    Public status endpoint for guest event payment flow.
    Returns ticket info, payable amount, paid status and receipt (if available).
    """
    from events.models import EventRegistration
    ticket = (ticket_number or '').strip().upper()
    if not ticket:
        raise ValidationError('ticket_number is required')
    reg = EventRegistration.objects.filter(ticket_number=ticket).select_related('event').first()
    if not reg or not reg.is_guest:
        raise NotFound('Guest event registration not found')
    payment = Payment.objects.filter(event_registration=reg).order_by('-created_at').first()
    return Response({
        'registration_id': reg.id,
        'ticket_number': reg.ticket_number,
        'event_title': reg.event.title if reg.event else '',
        'guest_name': reg.guest_name,
        'guest_email': reg.guest_email,
        'amount_payable': str(reg.amount_payable),
        'paid': bool(reg.paid),
        'receipt_number': payment.receipt_number if payment else None,
        'payment_method': payment.get_method_display() if payment else None,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def public_guest_mpesa_stk_push(request):
    """
    Public STK push for guest event registration.
    Body: { ticket_number, phone_number, guest_email? }
    """
    from payments.mpesa import stk_push
    from events.models import EventRegistration

    ticket_number = (request.data.get('ticket_number') or '').strip().upper()
    phone_number = (request.data.get('phone_number') or '').strip()
    guest_email = (request.data.get('guest_email') or '').strip().lower()
    if not ticket_number or not phone_number:
        raise ValidationError('ticket_number and phone_number are required')

    reg = EventRegistration.objects.filter(ticket_number=ticket_number).select_related('event').first()
    if not reg or not reg.is_guest:
        raise NotFound('Guest event registration not found')
    if reg.paid:
        raise ValidationError('This registration is already paid')
    if reg.guest_email and guest_email and reg.guest_email.strip().lower() != guest_email:
        raise PermissionDenied('Provided email does not match this ticket')

    amount = float(reg.amount_payable or 0)
    if amount <= 0:
        raise ValidationError('No amount to pay')

    try:
        result = stk_push(
            phone_number=phone_number,
            amount=amount,
            account_reference=f"EVT{reg.id}",
            transaction_desc=f"Event {reg.event_id}",
        )
    except Exception as e:
        logger.exception('Public guest M-Pesa STK push failed')
        raise ValidationError(str(e))

    checkout_id = result.get('CheckoutRequestID') or result.get('MerchantRequestID')
    if not checkout_id:
        raise ValidationError(result.get('errorMessage', 'M-Pesa request failed'))

    PendingMpesaTransaction.objects.create(
        checkout_request_id=checkout_id,
        member=reg.member if reg.member_id else None,
        event_registration=reg,
        amount=reg.amount_payable,
        phone_number=phone_number,
    )
    return Response({
        'detail': 'M-Pesa prompt sent. Enter your PIN on your phone to complete payment.',
        'CheckoutRequestID': checkout_id,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def public_guest_paybill_confirm(request):
    """
    Public manual confirmation for guest event paybill payments.
    Body: { ticket_number, transaction_code, phone_number?, guest_email? }
    """
    from events.models import EventRegistration
    ticket_number = (request.data.get('ticket_number') or '').strip().upper()
    transaction_code = (request.data.get('transaction_code') or '').strip().upper()
    phone_number = (request.data.get('phone_number') or '').strip()
    guest_email = (request.data.get('guest_email') or '').strip().lower()
    if not ticket_number or not transaction_code:
        raise ValidationError('ticket_number and transaction_code are required')
    reg = EventRegistration.objects.filter(ticket_number=ticket_number).select_related('event').first()
    if not reg or not reg.is_guest:
        raise NotFound('Guest event registration not found')
    if reg.paid:
        raise ValidationError('This registration is already paid')
    if reg.guest_email and guest_email and reg.guest_email.strip().lower() != guest_email:
        raise PermissionDenied('Provided email does not match this ticket')

    payment = Payment.objects.create(
        member=reg.member if reg.member_id else None,
        payment_type='event',
        amount=reg.amount_payable,
        method='mpesa',
        transaction_code=transaction_code,
        narration=f"Guest paybill confirmation for ticket {reg.ticket_number}" + (f" | phone: {phone_number}" if phone_number else ""),
        event_registration=reg,
    )
    _sync_after_event_payment(payment)
    send_payment_receipt_email(payment)
    return Response({
        'detail': 'Payment recorded successfully. Receipt generated.',
        'receipt_number': payment.receipt_number,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def member_event_paybill_confirm(request):
    """
    Member manual confirmation for event paybill payment.
    Body: { event_registration_id, transaction_code, phone_number? }
    """
    from events.models import EventRegistration
    member_id = get_member_id(request)
    if not member_id:
        raise PermissionDenied('Member login required')
    reg_id = request.data.get('event_registration_id')
    transaction_code = (request.data.get('transaction_code') or '').strip().upper()
    phone_number = (request.data.get('phone_number') or '').strip()
    if not reg_id or not transaction_code:
        raise ValidationError('event_registration_id and transaction_code are required')
    reg = EventRegistration.objects.filter(pk=reg_id).select_related('member').first()
    if not reg:
        raise NotFound('Event registration not found')
    if reg.member_id != member_id:
        raise PermissionDenied('You can only confirm payment for your own ticket')
    if reg.paid:
        raise ValidationError('This registration is already paid')

    payment = Payment.objects.create(
        member=reg.member,
        payment_type='event',
        amount=reg.amount_payable,
        method='mpesa',
        transaction_code=transaction_code,
        narration=f"Member paybill confirmation for ticket {reg.ticket_number}" + (f" | phone: {phone_number}" if phone_number else ""),
        event_registration=reg,
    )
    _sync_after_event_payment(payment)
    send_payment_receipt_email(payment)
    return Response({
        'detail': 'Payment recorded successfully. Receipt generated.',
        'receipt_number': payment.receipt_number,
    }, status=status.HTTP_201_CREATED)


@csrf_exempt
@require_http_methods(['POST'])
def mpesa_callback(request):
    """
    Callback from Safaricom for STK push result. No auth - validated by URL secrecy.
    """
    try:
        body = json.loads(request.body.decode())
    except (json.JSONDecodeError, ValueError):
        return HttpResponse('Invalid JSON', status=400)

    stk_callback = body.get('Body', {}).get('stkCallback', {})
    if not stk_callback:
        return HttpResponse('OK', status=200)

    checkout_request_id = stk_callback.get('CheckoutRequestID')
    result_code = stk_callback.get('ResultCode', -1)

    try:
        pending = PendingMpesaTransaction.objects.get(checkout_request_id=checkout_request_id)
    except PendingMpesaTransaction.DoesNotExist:
        logger.warning('M-Pesa callback for unknown CheckoutRequestID: %s', checkout_request_id)
        return HttpResponse('OK', status=200)

    if result_code != 0:
        logger.info('M-Pesa transaction failed: %s - %s', result_code, stk_callback.get('ResultDesc'))
        pending.delete()
        return HttpResponse('OK', status=200)

    # Success: extract MpesaReceiptNumber, Amount from CallbackMetadata
    metadata = stk_callback.get('CallbackMetadata', {}).get('Item', [])
    mpesa_receipt = ''
    for item in metadata:
        if item.get('Name') == 'MpesaReceiptNumber':
            mpesa_receipt = str(item.get('Value', ''))
            break

    reg = pending.event_registration
    payment = Payment.objects.create(
        member=pending.member,
        payment_type='event',
        amount=pending.amount,
        method='mpesa',
        transaction_code=mpesa_receipt,
        event_registration=reg,
    )
    _sync_after_event_payment(payment)
    send_payment_receipt_email(payment)
    pending.delete()
    return HttpResponse('OK', status=200)
