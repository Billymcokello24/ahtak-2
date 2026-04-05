from django.contrib import admin
from core.admin import DateTimePickerMixin
from .models import Event, EventRegistration, EventCheckIn


@admin.register(Event)
class EventAdmin(DateTimePickerMixin, admin.ModelAdmin):
    list_display = ('title', 'category', 'event_type', 'status', 'start_date', 'max_attendees')
    list_filter = ('category', 'event_type', 'status')
    search_fields = ('title', 'description')


@admin.register(EventRegistration)
class EventRegistrationAdmin(DateTimePickerMixin, admin.ModelAdmin):
    list_display = ('ticket_number', 'event', 'member', 'guest_name', 'paid', 'created_at')
    list_filter = ('event', 'paid')


@admin.register(EventCheckIn)
class EventCheckInAdmin(admin.ModelAdmin):
    list_display = ('registration', 'checked_in_at', 'method')
