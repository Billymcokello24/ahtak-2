from datetime import date
from dateutil.relativedelta import relativedelta
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from core.utils import log_audit
from core.permissions import get_user_role, get_member_id, role_can_access, IsMemberOwnerOrStaff
from core.pdf_utils import member_id_card_pdf
from notifications.emails import send_registration_received_email, send_welcome_email

from .models import MembershipType, Member, MemberDocument
from .serializers import (
    MembershipTypeSerializer,
    MemberSerializer,
    MemberListSerializer,
    MemberRegisterSerializer,
    MemberDocumentSerializer,
)


class MemberRegisterView(viewsets.ViewSet):
    """Public endpoint for non-members to apply for membership. Creates Member + User (inactive)."""
    permission_classes = [AllowAny]
    authentication_classes = []
    serializer_class = MemberRegisterSerializer

    def create(self, request):
        from django.contrib.auth import get_user_model
        from django.db import transaction
        from core.models import UserProfile
        User = get_user_model()
        ser = MemberRegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data.copy()
        password = data.pop('password')
        data.pop('password_confirm')
        # Normalize empty FK and blank strings
        if not data.get('membership_type'):
            data['membership_type'] = None
        if data.get('date_of_birth') == '':
            data['date_of_birth'] = None
        try:
            with transaction.atomic():
                member = Member.objects.create(status='pending', **data)
                username = member.email.strip().lower()
                if User.objects.filter(username__iexact=username).exists():
                    raise serializers.ValidationError(
                        {'email': 'An account with this email already exists.'}
                    )
                user = User.objects.create_user(
                    username=username,
                    email=member.email,
                    password=password,
                    first_name=member.first_name,
                    last_name=member.last_name,
                    is_active=False,
                )
                # core.signals auto-creates a profile for new users; update it instead
                # of creating a second row (which triggers unique user_id violation).
                UserProfile.objects.update_or_create(
                    user=user,
                    defaults={'role': 'member', 'member': member},
                )
        except serializers.ValidationError:
            raise
        except Exception as e:
            from django.db import IntegrityError
            if isinstance(e, IntegrityError):
                msg = str(e).lower()
                if 'username' in msg or 'email' in msg:
                    raise serializers.ValidationError(
                        {'email': 'An account with this email already exists.'}
                    )
                if 'userprofile_user_id_key' in msg:
                    raise serializers.ValidationError(
                        {'detail': 'Profile linkage failed. Please try again.'}
                    )
            raise
        send_registration_received_email(member)
        return Response(
            {
                'detail': 'Application submitted successfully. We sent a confirmation to your email. You will receive another email once approved; then you can sign in with your email and password.',
                'member_number': member.member_number,
            },
            status=status.HTTP_201_CREATED
        )


class MembershipTypeViewSet(viewsets.ModelViewSet):
    queryset = MembershipType.objects.filter(is_active=True)
    serializer_class = MembershipTypeSerializer


class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    filterset_fields = ['status', 'membership_type']
    search_fields = ['member_number', 'first_name', 'last_name', 'email', 'phone', 'kvb_number']
    permission_classes = [IsMemberOwnerOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        role = get_user_role(self.request)
        if role == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(id=mid)
            return qs.none()
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return MemberListSerializer
        return MemberSerializer

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve pending member: set active, expiry, activate User, send welcome email."""
        member = self.get_object()
        if member.status != 'pending':
            return Response(
                {'detail': 'Member is not pending approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        member.status = 'active'
        member.approved_at = timezone.now()
        member.approved_by = request.user
        if member.membership_type and member.membership_type.validity_months:
            from datetime import date
            start = member.membership_expiry or date.today()
            if not member.membership_expiry or member.membership_expiry < date.today():
                start = date.today()
            member.membership_expiry = start + relativedelta(months=member.membership_type.validity_months)
        member.save()
        # Activate linked User so they can sign in
        try:
            profile = getattr(member, 'user_account', None)
            if profile and profile.user:
                profile.user.is_active = True
                profile.user.save(update_fields=['is_active'])
        except Exception:
            pass
        send_welcome_email(member)
        log_audit(request, 'update', 'Member', member.pk, str(member), {'status': ['pending', 'active']})
        return Response(MemberSerializer(member).data)

    @action(detail=True, methods=['get'])
    def id_card(self, request, pk=None):
        """Download member ID card as PDF."""
        member = self.get_object()
        buf = member_id_card_pdf(member)
        response = HttpResponse(buf.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="member_id_{member.member_number}.pdf"'
        return response


class MemberDocumentViewSet(viewsets.ModelViewSet):
    queryset = MemberDocument.objects.all()
    serializer_class = MemberDocumentSerializer
    parser_classes = (MultiPartParser, FormParser)
    filterset_fields = ['member', 'document_type']
    permission_classes = [IsMemberOwnerOrStaff]

    def get_queryset(self):
        qs = super().get_queryset()
        if get_user_role(self.request) == 'member':
            mid = get_member_id(self.request)
            if mid:
                return qs.filter(member_id=mid)
            return qs.none()
        return qs
