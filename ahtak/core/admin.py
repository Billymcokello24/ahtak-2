from django import forms
from django.contrib import admin
from django.db import models
from .models import AuditLog, UserProfile


class DateTimePickerMixin(admin.ModelAdmin):
    """Use HTML5 datetime-local for full date/time picker instead of limited dropdown."""
    formfield_overrides = {
        models.DateTimeField: {
            'form_class': forms.DateTimeField,
            'widget': forms.DateTimeInput(attrs={'type': 'datetime-local'}, format='%Y-%m-%dT%H:%M'),
        },
    }


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'model_name', 'object_id', 'user', 'ip_address', 'created_at')
    list_filter = ('action', 'model_name')
    search_fields = ('object_id', 'object_repr', 'user__username')
    readonly_fields = ('user', 'action', 'model_name', 'object_id', 'object_repr', 'changes', 'ip_address', 'user_agent', 'created_at')
    date_hierarchy = 'created_at'


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'member')
    list_filter = ('role',)
    search_fields = ('user__username', 'member__member_number')
    autocomplete_fields = ('member',)
