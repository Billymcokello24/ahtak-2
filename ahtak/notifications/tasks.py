import logging
from celery import shared_task
from datetime import date
from django.core.mail import send_mail
from django.conf import settings

from members.models import Member
from events.models import EventRegistration
from notifications.emails import send_event_reminder_email

logger = logging.getLogger(__name__)


def send_reminder(member, days_left):
    """Send membership renewal reminder via email (and optionally SMS)."""
    subject = f"Membership renewal reminder – {days_left} days left"
    message = (
        f"Dear {member.first_name} {member.last_name},\n\n"
        f"Your membership (Member No: {member.member_number}) will expire in {days_left} days "
        f"(on {member.membership_expiry}).\n\n"
        "Please renew at your earliest convenience to continue enjoying member benefits.\n\n"
        "Best regards,\nAHTTAK Membership System"
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else None,
            recipient_list=[member.email],
            fail_silently=True,
        )
        logger.info("Renewal reminder sent to %s (%s days)", member.member_number, days_left)
    except Exception as e:
        logger.warning("Failed to send renewal reminder to %s: %s", member.member_number, e)
    # TODO: SMS integration (e.g. Africa's Talking, Twilio)


@shared_task
def check_membership_expiry():
    today = date.today()
    members = Member.objects.filter(
        membership_expiry__isnull=False,
        status__in=["active", "pending_renewal"]
    )
    for m in members:
        days_left = (m.membership_expiry - today).days
        if days_left in (90, 60, 30, 7):
            send_reminder(m, days_left)
        elif days_left == 30:
            # Optionally update status to Pending Renewal
            if m.status == "active":
                m.status = "pending_renewal"
                m.save(update_fields=["status"])
        elif days_left < 0:
            m.status = "expired"
            m.save(update_fields=["status"])


@shared_task
def send_event_reminders():
    """
    Send reminders to registrants for upcoming published events.
    Reminders at: 7 days, 1 day, 1 hour before event start.
    """
    from django.utils import timezone
    now = timezone.now()
    thresholds = [
        ("7 days", 7 * 24 * 3600),
        ("1 day", 24 * 3600),
        ("1 hour", 3600),
    ]

    regs = EventRegistration.objects.select_related("event", "member").filter(event__status="published")
    for reg in regs:
        e = reg.event
        if not e or not e.start_date:
            continue
        delta = (e.start_date - now).total_seconds()
        if delta < 0:
            continue
        # Send once per threshold per registration; store markers in notes as a simple idempotency mechanism
        # (No notifications model exists yet.)
        marker_base = f"reminded:{reg.id}:"
        notes = (reg.notes or "")
        for label, seconds in thresholds:
            marker = f"{marker_base}{label}"
            if abs(delta - seconds) <= 90 and marker not in notes:
                to_email = reg.member.email if reg.member and reg.member.email else reg.guest_email
                if to_email:
                    send_event_reminder_email(to_email, e, label)
                    reg.notes = (notes + "\n" + marker).strip()
                    reg.save(update_fields=["notes"])
                break


def _active_member_emails():
    return list(
        Member.objects.filter(status="active")
        .exclude(email="")
        .values_list("email", flat=True)
        .distinct()
    )


@shared_task
def notify_members_blog_post(blog_post_id, reason="new"):
    """Email all active members about a published blog post (Celery worker)."""
    from django.core.mail import EmailMessage, get_connection
    from website.models import BlogPost

    try:
        post = BlogPost.objects.get(pk=blog_post_id)
    except BlogPost.DoesNotExist:
        logger.warning("notify_members_blog_post: missing post %s", blog_post_id)
        return
    if post.status != "published":
        return
    recipients = _active_member_emails()
    if not recipients:
        logger.info("notify_members_blog_post: no active member emails")
        return
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    url = f"{base}/blog/{post.slug}"
    if reason == "update":
        subject = "AHTTAK – News article updated"
        intro = "An announcement on our website was updated"
    else:
        subject = "AHTTAK – New announcement"
        intro = "A new announcement has been published on our website"
    body = (
        f"{intro}:\n\n"
        f"{post.title}\n\n"
        f"Read more: {url}\n\n"
        "Best regards,\nAHTTAK"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
    connection = get_connection()
    messages = [
        EmailMessage(subject=subject, body=body, from_email=from_email, to=[addr], connection=connection)
        for addr in recipients
    ]
    try:
        connection.send_messages(messages)
        logger.info("Blog notify sent to %s members for post %s", len(recipients), blog_post_id)
    except Exception as e:
        logger.warning("notify_members_blog_post failed: %s", e)


@shared_task
def notify_members_event_published(event_id, reason="new"):
    """Email all active members about a published event."""
    from django.core.mail import EmailMessage, get_connection
    from events.models import Event

    try:
        event = Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        logger.warning("notify_members_event_published: missing event %s", event_id)
        return
    if event.status != "published":
        return
    recipients = _active_member_emails()
    if not recipients:
        logger.info("notify_members_event_published: no active member emails")
        return
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    url = f"{base}/events/{event.id}"
    if reason == "update":
        subject = f"AHTTAK – Event updated: {event.title}"
        intro = "Event details were updated"
    else:
        subject = f"AHTTAK – New event: {event.title}"
        intro = "A new event has been published"
    body = (
        f"{intro}:\n\n"
        f"{event.title}\n"
        f"Starts: {event.start_date}\n\n"
        f"Details: {url}\n\n"
        "Best regards,\nAHTTAK"
    )
    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", None)
    connection = get_connection()
    messages = [
        EmailMessage(subject=subject, body=body, from_email=from_email, to=[addr], connection=connection)
        for addr in recipients
    ]
    try:
        connection.send_messages(messages)
        logger.info("Event notify sent to %s members for event %s", len(recipients), event_id)
    except Exception as e:
        logger.warning("notify_members_event_published failed: %s", e)
