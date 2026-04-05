from rest_framework import serializers
from .models import MembershipType, Member, MemberDocument


class MembershipTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipType
        fields = '__all__'


class MemberDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberDocument
        fields = '__all__'
        read_only_fields = ('uploaded_at',)


class MemberSerializer(serializers.ModelSerializer):
    documents = MemberDocumentSerializer(many=True, read_only=True)
    membership_type_detail = MembershipTypeSerializer(source='membership_type', read_only=True)

    class Meta:
        model = Member
        fields = '__all__'
        read_only_fields = ('member_number', 'date_joined', 'approved_at', 'approved_by')


class MemberRegisterSerializer(serializers.ModelSerializer):
    """For public member registration (creates pending member + inactive user)."""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model = Member
        fields = (
            'first_name', 'last_name', 'email', 'phone', 'kvb_number',
            'password', 'password_confirm',
            'date_of_birth', 'gender', 'physical_address', 'membership_type',
        )
        extra_kwargs = {
            'kvb_number': {'required': True, 'allow_blank': False},
            'date_of_birth': {'required': False},
            'gender': {'required': False},
            'physical_address': {'required': False},
            'membership_type': {'required': False},
        }

    def validate_kvb_number(self, value):
        if value is None or not str(value).strip():
            raise serializers.ValidationError('KVB number is required.')
        return str(value).strip()

    def validate_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        if Member.objects.filter(email__iexact=value).exclude(status='expired').exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        if attrs.get('membership_type') in ('', None):
            attrs['membership_type'] = None
        if attrs.get('date_of_birth') == '':
            attrs['date_of_birth'] = None
        return attrs


class MemberListSerializer(serializers.ModelSerializer):
    membership_type_name = serializers.CharField(source='membership_type.name', read_only=True)

    class Meta:
        model = Member
        fields = (
            'id', 'member_number', 'first_name', 'last_name', 'email', 'phone',
            'status', 'membership_expiry', 'membership_type', 'membership_type_name', 'date_joined'
        )
