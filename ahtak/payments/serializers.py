from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    member_number = serializers.SerializerMethodField()
    event_ticket_number = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ('receipt_number', 'created_at')

    def get_member_number(self, obj):
        return obj.member.member_number if obj.member else None

    def get_event_ticket_number(self, obj):
        reg = obj.event_registration
        return reg.ticket_number if reg else None
