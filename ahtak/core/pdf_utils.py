"""PDF generation utilities: receipts, ID cards, with professional layout and QR codes."""
from io import BytesIO
from datetime import date, datetime

from django.conf import settings


def _qr_image(data: str, size_mm: float = 35):
    """Generate QR code image as PNG bytes. Uses qrcode library."""
    try:
        import qrcode
        from reportlab.lib.units import mm
    except ImportError:
        raise ImportError("qrcode is required for receipt QR. pip install qrcode[pil]")
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return buf, size_mm


def receipt_pdf(payment):
    """Generate a professional receipt PDF with full details, status, and scan-to-verify QR."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.lib.utils import ImageReader
        from reportlab.pdfgen import canvas
    except ImportError:
        raise ImportError("reportlab is required for PDF generation. pip install reportlab")

    buf = BytesIO()
    w, h = A4
    c = canvas.Canvas(buf, pagesize=A4)

    # Brand header
    c.setFillColorRGB(0.12, 0.23, 0.37)  # #1e3a5f
    c.rect(0, h - 28 * mm, w, 28 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(w / 2, h - 12 * mm, "AHTTAK Membership System")
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, h - 18 * mm, "OFFICIAL RECEIPT")

    # Status badge (always PAID for receipts)
    status = "PAID"
    c.setFillColorRGB(0.13, 0.59, 0.33)  # emerald
    c.roundRect(w - 38 * mm, h - 26 * mm, 32 * mm, 10 * mm, 3, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(w - 22 * mm, h - 21 * mm, status)

    y = h - 38 * mm
    c.setFillColorRGB(0.2, 0.2, 0.2)

    # Receipt details block
    c.setFont("Helvetica-Bold", 11)
    c.drawString(18 * mm, y, "Receipt Details")
    y -= 6 * mm
    c.setFont("Helvetica", 10)

    pay_date = payment.payment_date or (payment.created_at.date() if payment.created_at else date.today())
    pay_time = payment.created_at.strftime("%H:%M:%S") if payment.created_at else "—"

    if payment.member:
        payer_number = payment.member.member_number
        payer_name = f"{payment.member.first_name} {payment.member.last_name}".strip()
    elif payment.event_registration and payment.event_registration.is_guest:
        payer_number = "GUEST"
        payer_name = payment.event_registration.guest_name or "Guest attendee"
    else:
        payer_number = "N/A"
        payer_name = "Unassigned payer"

    payment_type_label = {
        "event": "Event",
        "membership": "Membership",
        "renewal": "Membership Renewal",
        "registration": "Membership Registration",
    }.get(payment.payment_type, payment.get_payment_type_display())

    rows = [
        ("Receipt Number", payment.receipt_number),
        ("Date", str(pay_date)),
        ("Time", pay_time),
        ("Status", status),
        ("Payer No", payer_number),
        ("Payer Name", payer_name),
        ("Payment Type", payment_type_label),
        ("Amount (KES)", f"{payment.amount:,.2f}"),
        ("Payment Method", payment.get_method_display()),
        ("Transaction Code", payment.transaction_code or "—"),
    ]
    if payment.narration:
        rows.append(("Narration", payment.narration[:200] + ("..." if len(payment.narration) > 200 else "")))

    # Link to event / savings if applicable
    if payment.event_registration_id:
        event_ref = payment.event_registration.ticket_number if payment.event_registration else f"#{payment.event_registration_id}"
        rows.append(("Event Registration", event_ref))
        if payment.event_registration and payment.event_registration.event:
            rows.append(("Event Title", payment.event_registration.event.title))
    if payment.savings_account_id:
        rows.append(("Savings Account", f"#{payment.savings_account_id}"))

    label_w = 40 * mm
    for label, value in rows:
        c.setFont("Helvetica", 9)
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.drawString(18 * mm, y, label + ":")
        c.setFillColorRGB(0.15, 0.15, 0.15)
        c.drawString(18 * mm + label_w, y, str(value)[:80])
        y -= 5.5 * mm

    y -= 4 * mm
    c.setFont("Helvetica", 9)
    c.setFillColorRGB(0.3, 0.3, 0.3)
    c.drawString(18 * mm, y, "Thank you for your payment.")
    y -= 10 * mm

    # QR code - verification / pay URL
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:5173").rstrip("/")
    verify_url = f"{frontend_url}/verify-receipt/{payment.receipt_number}"
    try:
        qr_buf, qr_size = _qr_image(verify_url)
        qr_buf.seek(0)
        qr_w = qr_size * mm
        qr_x = 18 * mm
        qr_y = y - qr_w - 5 * mm
        c.drawImage(ImageReader(qr_buf), qr_x, qr_y, width=qr_w, height=qr_w)
        c.setFont("Helvetica", 8)
        c.setFillColorRGB(0.45, 0.45, 0.45)
        c.drawString(qr_x, qr_y - 6 * mm, "Scan to verify receipt")
    except Exception:
        pass  # Skip QR if generation fails

    # Optional: Pay AHTTAK QR if Paybill configured (scan to pay)
    shortcode = getattr(settings, "MPESA_SHORTCODE", "") or ""
    if shortcode:
        pay_url = f"{frontend_url}/pay?ref={payment.receipt_number}&amount={payment.amount}"
        try:
            qr_buf2, qr_size2 = _qr_image(pay_url, size_mm=28)
            qr_buf2.seek(0)
            qr_w2 = qr_size2 * mm
            qr_x2 = w - 45 * mm
            qr_y2 = y - qr_w2 - 5 * mm
            c.drawImage(ImageReader(qr_buf2), qr_x2, qr_y2, width=qr_w2, height=qr_w2)
            c.drawString(qr_x2, qr_y2 - 6 * mm, "Scan to pay")
        except Exception:
            pass

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColorRGB(0.5, 0.5, 0.5)
    c.drawCentredString(w / 2, 12 * mm, "This is a computer-generated receipt. For verification, scan the QR code.")
    c.drawCentredString(w / 2, 8 * mm, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    c.save()
    buf.seek(0)
    return buf


def member_id_card_pdf(member):
    """Generate a simple member ID card as PDF (single card size ~86x54mm)."""
    try:
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except ImportError:
        raise ImportError("reportlab is required for PDF generation. pip install reportlab")
    buf = BytesIO()
    w, h = 86 * mm, 54 * mm
    c = canvas.Canvas(buf, pagesize=(w, h))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(5 * mm, h - 10 * mm, "AHTTAK Membership System")
    c.setFont("Helvetica", 8)
    c.drawString(5 * mm, h - 16 * mm, "Member ID Card")
    c.drawString(5 * mm, h - 22 * mm, f"Member No: {member.member_number}")
    c.drawString(5 * mm, h - 28 * mm, f"Name: {member.first_name} {member.last_name}")
    c.drawString(5 * mm, h - 34 * mm, f"Valid until: {member.membership_expiry or 'N/A'}")
    c.drawString(5 * mm, h - 40 * mm, f"Status: {member.get_status_display()}")
    c.setFont("Helvetica", 6)
    c.drawString(5 * mm, 5 * mm, f"Issued: {date.today().isoformat()}")
    c.save()
    buf.seek(0)
    return buf


def event_certificate_pdf(registration):
    """Generate CPD/attendance certificate for an event registration."""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import mm
        from reportlab.pdfgen import canvas
    except ImportError:
        raise ImportError("reportlab is required for PDF generation. pip install reportlab")
    reg = registration
    event = reg.event
    member = reg.member
    attendee_name = f"{member.first_name} {member.last_name}" if member else reg.guest_name or "Guest"
    buf = BytesIO()
    w, h = A4
    c = canvas.Canvas(buf, pagesize=A4)
    # Header
    c.setFillColorRGB(0.12, 0.23, 0.37)
    c.rect(0, h - 25 * mm, w, 25 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(w / 2, h - 10 * mm, "AHTTAK Membership System")
    c.setFont("Helvetica", 11)
    c.drawCentredString(w / 2, h - 17 * mm, "Certificate of Attendance")
    c.setFillColorRGB(0.2, 0.2, 0.2)
    y = h - 45 * mm
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, y, "This is to certify that")
    y -= 10 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(w / 2, y, attendee_name)
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, y, f"attended")
    y -= 8 * mm
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(w / 2, y, event.title)
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    date_str = event.start_date.strftime("%B %d, %Y") if event.start_date else ""
    c.drawCentredString(w / 2, y, date_str)
    if event.cpd_points:
        y -= 12 * mm
        c.setFont("Helvetica-Bold", 11)
        c.drawCentredString(w / 2, y, f"CPD Points: {event.cpd_points}")
    y -= 15 * mm
    c.setFont("Helvetica", 9)
    c.drawCentredString(w / 2, y, f"Ticket: {reg.ticket_number}")
    c.drawCentredString(w / 2, y - 6 * mm, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    c.save()
    buf.seek(0)
    return buf
