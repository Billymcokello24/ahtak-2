"""Signals for payments app."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Payment


@receiver(post_save, sender=Payment)
def payment_created_update_event_registration(sender, instance, created, **kwargs):
    """When a Payment for event registration is created, mark EventRegistration as paid."""
    if not created:
        return
    if instance.payment_type != 'event' or not instance.event_registration_id:
        return
    reg = instance.event_registration
    if reg and not reg.paid:
        reg.paid = True
        reg.paid_at = timezone.now()
        reg.save(update_fields=['paid', 'paid_at'])
