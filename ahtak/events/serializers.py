from rest_framework import serializers
from django.utils import timezone
from .models import Event, EventRegistration, EventCheckIn


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'


class EventRegistrationSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source='event.title', read_only=True)
    member_number = serializers.CharField(source='member.member_number', read_only=True)

    class Meta:
        model = EventRegistration
        fields = '__all__'
        read_only_fields = ('ticket_number',)

    def validate_event(self, event):
        now = timezone.now()
        cutoff = event.end_date or event.start_date
        if cutoff and cutoff < now:
            raise serializers.ValidationError('Registration is closed for past events.')
        return event


class EventCheckInSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventCheckIn
        fields = '__all__'
