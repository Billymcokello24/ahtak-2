from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from core.permissions import get_member_id, role_can_access, get_user_role
from .models import Event, EventRegistration, EventCheckIn
from .serializers import EventSerializer, EventRegistrationSerializer, EventCheckInSerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filterset_fields = ['category', 'event_type', 'status']
    search_fields = ['title', 'description']

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.query_params.get('has_cpd') == 'true':
            from django.db.models import Q
            qs = qs.filter(cpd_points__gt=0)
        return qs


class EventRegistrationViewSet(viewsets.ModelViewSet):
    queryset = EventRegistration.objects.all()
    serializer_class = EventRegistrationSerializer
    filterset_fields = ['event', 'member', 'paid']

    def get_permissions(self):
        # Allow public guest registrations without requiring account login.
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

    def perform_create(self, serializer):
        # For unauthenticated requests, force guest registration.
        if not self.request.user.is_authenticated:
            if self.request.data.get('member'):
                raise ValidationError('Member registration requires login. Use guest registration.')
            serializer.validated_data['member'] = None
            serializer.validated_data['is_guest'] = True
        reg = serializer.save()
        # Set amount if not set: member vs non-member, early bird
        if reg.amount_payable == 0 and reg.event:
            e = reg.event
            is_early = e.early_bird_deadline and timezone.now() <= e.early_bird_deadline
            if reg.member and not reg.is_guest:
                reg.amount_payable = (e.early_bird_price_member if is_early and e.early_bird_price_member else e.price_member) or 0
            else:
                reg.amount_payable = (e.early_bird_price_non_member if is_early and e.early_bird_price_non_member else e.price_non_member) or 0
            reg.save()
        # Store ticket number as QR data for scanning
        if not reg.qr_code:
            reg.qr_code = reg.ticket_number
            reg.save(update_fields=['qr_code'])

        # Email confirmation to registrant (member or guest)
        try:
            from notifications.emails import send_event_registration_email
            to_email = None
            if reg.member and reg.member.email:
                to_email = reg.member.email
            elif reg.guest_email:
                to_email = reg.guest_email
            if to_email:
                send_event_registration_email(to_email, reg.event, reg.ticket_number)
        except Exception:
            pass

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        """Check in by ticket number (QR or manual). Creates EventCheckIn if not already checked in."""
        ticket_number = (request.data.get('ticket_number') or '').strip().upper()
        if not ticket_number:
            return Response({'detail': 'ticket_number required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            reg = EventRegistration.objects.get(ticket_number=ticket_number)
        except EventRegistration.DoesNotExist:
            return Response({'detail': 'Invalid ticket number'}, status=status.HTTP_404_NOT_FOUND)
        if hasattr(reg, 'check_in') and reg.check_in:
            return Response(EventCheckInSerializer(reg.check_in).data)
        check_in = EventCheckIn.objects.create(
            registration=reg,
            method=request.data.get('method', 'manual'),
            checked_in_by=getattr(request.user, 'username', '') if request.user.is_authenticated else '',
        )
        return Response(EventCheckInSerializer(check_in).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='certificate')
    def certificate_pdf(self, request, pk=None):
        """Download attendance certificate for a completed registration (paid + checked in, event has certificate_issued)."""
        reg = self.get_object()
        if not reg.event.certificate_issued:
            return Response({'detail': 'Certificate not available for this event'}, status=status.HTTP_404_NOT_FOUND)
        member_id = get_member_id(request)
        role = get_user_role(request)
        if role == 'member' and (not member_id or reg.member_id != member_id):
            return Response({'detail': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
        if not hasattr(reg, 'check_in') or not reg.check_in:
            return Response({'detail': 'No check-in record. Attend the event to receive a certificate.'}, status=status.HTTP_400_BAD_REQUEST)
        from core.pdf_utils import event_certificate_pdf
        buf = event_certificate_pdf(reg)
        resp = HttpResponse(buf.getvalue(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="certificate_{reg.ticket_number}.pdf"'
        return resp

    @action(detail=False, methods=['get'], url_path='my-cpd-summary')
    def my_cpd_summary(self, request):
        """CPD points earned by the current member (from attended CPD events)."""
        member_id = get_member_id(request)
        if not member_id:
            return Response({'detail': 'Member login required'}, status=status.HTTP_403_FORBIDDEN)
        from django.db.models import Sum
        from django.db.models.functions import Coalesce
        regs = EventRegistration.objects.filter(
            member_id=member_id
        ).filter(
            event__cpd_points__gt=0
        ).select_related('event')
        # Only count if checked in (attended)
        total = 0
        events_list = []
        for r in regs:
            if hasattr(r, 'check_in') and r.check_in:
                pts = r.event.cpd_points or 0
                total += pts
                events_list.append({
                    'event_title': r.event.title,
                    'event_date': str(r.event.start_date) if r.event.start_date else None,
                    'cpd_points': pts,
                })
        return Response({'total_cpd_points': total, 'events': events_list})


class EventCheckInViewSet(viewsets.ModelViewSet):
    queryset = EventCheckIn.objects.all()
    serializer_class = EventCheckInSerializer
    filterset_fields = ['registration__event']
