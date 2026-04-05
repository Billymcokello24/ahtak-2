"""Email sending helpers."""
import logging
from django.core.mail import send_mail, EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)


def _login_url():
    """Return the login URL from settings (for use in emails)."""
    base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return base.rstrip('/') + '/login'


def send_welcome_email(member):
    """Send welcome email when member is approved. Includes login URL if they have an account."""
    subject = "Welcome to AHTTAK Membership System – Your membership is approved"
    base_msg = (
        f"Dear {member.first_name} {member.last_name},\n\n"
        f"Your membership has been approved. Your member number is: {member.member_number}.\n\n"
        f"Membership expiry: {member.membership_expiry or 'N/A'}\n\n"
    )
    has_user = False
    try:
        has_user = hasattr(member, 'user_account') and member.user_account and member.user_account.user
    except Exception:
        pass
    if has_user:
        login_url = _login_url()
        message = (
            base_msg
            + "You can now sign in to the member portal:\n"
            + f"  {login_url}\n\n"
            + "Use your email address as username and the password you set during registration.\n\n"
            + "If you forgot your password, please contact us for support.\n\n"
        )
    else:
        message = base_msg + "Please contact us to set up your member portal access.\n\n"
    message += "Best regards,\nAHTTAK Membership System"
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[member.email],
            fail_silently=True,
        )
        logger.info("Welcome email sent to %s", member.member_number)
    except Exception as e:
        logger.warning("Failed to send welcome email to %s: %s", member.member_number, e)


def send_event_registration_email(to_email: str, event, ticket_number: str):
    subject = f"Event registration confirmed – {event.title}"
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    event_url = f"{base}/events/{event.id}"
    msg = (
        f"Your registration has been received.\n\n"
        f"Event: {event.title}\n"
        f"Start: {event.start_date}\n"
        f"Ticket: {ticket_number}\n\n"
        f"View details: {event_url}\n\n"
        "Best regards,\nAHTTAK"
    )
    try:
        send_mail(subject, msg, getattr(settings, "DEFAULT_FROM_EMAIL", None), [to_email], fail_silently=True)
    except Exception as e:
        logger.warning("Failed to send event registration email to %s: %s", to_email, e)


def send_registration_received_email(member):
    """Confirm that a membership application was received (pending approval)."""
    subject = "AHTTAK – We received your membership application"
    message = (
        f"Dear {member.first_name} {member.last_name},\n\n"
        f"Thank you for applying. Your application is under review.\n"
        f"Your provisional member number is: {member.member_number}.\n\n"
        "You will receive another email when your membership is approved. "
        "After approval you can sign in to the member portal with the email and password you used to register.\n\n"
        "Best regards,\nAHTTAK Membership System"
    )
    if not member.email:
        return
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            recipient_list=[member.email],
            fail_silently=True,
        )
        logger.info("Registration received email sent to %s", member.member_number)
    except Exception as e:
        logger.warning("Failed to send registration received email to %s: %s", member.member_number, e)


def get_payment_receipt_recipient(payment):
    """Return (email, display_name) or (None, None) if no email on file."""
    if payment.member and payment.member.email:
        name = (payment.member.first_name or "").strip() or "Member"
        return payment.member.email.strip(), name
    if payment.event_registration and payment.event_registration.guest_email:
        reg = payment.event_registration
        name = (reg.guest_name or "Guest").strip()
        return reg.guest_email.strip(), name
    return None, None


def send_payment_receipt_email(payment):
    """
    Email the payment receipt PDF to the payer (member or guest).
    Used by manual 'Email receipt' and automatic sends after payment is recorded.
    """
    recipient_email, recipient_name = get_payment_receipt_recipient(payment)
    if not recipient_email:
        logger.info("Skipping receipt email: no recipient for payment %s", payment.pk)
        return False
    try:
        from core.pdf_utils import receipt_pdf

        buf = receipt_pdf(payment)
        buf.seek(0)
    except Exception as e:
        logger.warning("Failed to build receipt PDF for payment %s: %s", payment.pk, e)
        return False
    subject = f"Payment Receipt {payment.receipt_number} - AHTTAK"
    body_lines = [
        f"Dear {recipient_name},",
        "",
        f"Thank you. We recorded your payment of {payment.amount} KES "
        f"({payment.get_payment_type_display()}).",
        f"Receipt number: {payment.receipt_number}.",
        "",
        "Your official receipt is attached as a PDF.",
        "",
        "Best regards,",
        "AHTTAK Membership System",
    ]
    body = "\n".join(body_lines)
    try:
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
            to=[recipient_email],
        )
        email.attach(f"receipt_{payment.receipt_number}.pdf", buf.getvalue(), "application/pdf")
        email.send(fail_silently=True)
        logger.info("Payment receipt emailed for %s to %s", payment.receipt_number, recipient_email)
        return True
    except Exception as e:
        logger.warning("Failed to email receipt %s: %s", payment.receipt_number, e)
        return False


def send_event_reminder_email(to_email: str, event, when_label: str):
    subject = f"Reminder: {event.title} ({when_label})"
    base = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    event_url = f"{base}/events/{event.id}"
    meeting_link = getattr(event, "meeting_link", "") or ""
    msg = (
        f"This is a reminder that the following event is coming up ({when_label}).\n\n"
        f"Event: {event.title}\n"
        f"Start: {event.start_date}\n"
        f"View details: {event_url}\n"
    )
    if meeting_link:
        msg += f"\nJoin link: {meeting_link}\n"
    msg += "\nBest regards,\nAHTTAK"
    try:
        send_mail(subject, msg, getattr(settings, "DEFAULT_FROM_EMAIL", None), [to_email], fail_silently=True)
    except Exception as e:
        logger.warning("Failed to send event reminder email to %s: %s", to_email, e)
