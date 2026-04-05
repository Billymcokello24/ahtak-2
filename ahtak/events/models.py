from django.db import models


class Event(models.Model):
    CATEGORY_CHOICES = [
        ("agm", "AGM"),
        ("training", "Training"),
        ("workshop", "Workshop"),
        ("seminar", "Seminar"),
        ("social", "Social Event"),
    ]
    EVENT_TYPE_CHOICES = [
        ("physical", "Physical"),
        ("virtual", "Virtual"),
        ("hybrid", "Hybrid"),
    ]
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("published", "Published"),
        ("ongoing", "Ongoing"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    VENUE_PLATFORM_CHOICES = [
        ("zoom", "Zoom"),
        ("teams", "Microsoft Teams"),
        ("meet", "Google Meet"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    agenda = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="seminar")
    event_type = models.CharField(max_length=20, choices=EVENT_TYPE_CHOICES, default="physical")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")

    start_date = models.DateTimeField()
    end_date = models.DateTimeField(null=True, blank=True)
    timezone = models.CharField(max_length=50, default="Africa/Nairobi")

    # Venue - physical
    location = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    county = models.CharField(max_length=100, blank=True)
    map_link = models.URLField(blank=True)
    venue_capacity = models.PositiveIntegerField(null=True, blank=True)

    # Venue - virtual
    meeting_platform = models.CharField(max_length=20, choices=VENUE_PLATFORM_CHOICES, blank=True)
    meeting_link = models.URLField(blank=True)
    meeting_id = models.CharField(max_length=100, blank=True)
    meeting_password = models.CharField(max_length=100, blank=True)

    # Registration
    max_attendees = models.PositiveIntegerField(default=0)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    early_bird_deadline = models.DateTimeField(null=True, blank=True)
    membership_required = models.BooleanField(default=False)
    max_guests_per_registration = models.PositiveIntegerField(default=0)
    banner = models.ImageField(upload_to="events/banners/", null=True, blank=True)
    organizer_name = models.CharField(max_length=200, blank=True)
    organizer_contact = models.CharField(max_length=100, blank=True)
    cpd_points = models.PositiveIntegerField(null=True, blank=True)
    certificate_issued = models.BooleanField(default=False)

    # Pricing
    price_member = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_non_member = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    early_bird_price_member = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    early_bird_price_non_member = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )

    capacity = models.IntegerField(default=0)  # legacy alias for max_attendees
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class EventRegistration(models.Model):
    """Registration of a member or guest for an event."""
    ticket_number = models.CharField(max_length=20, unique=True, editable=False)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="registrations")
    member = models.ForeignKey(
        "members.Member",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="event_registrations"
    )
    # For non-member or guest
    guest_name = models.CharField(max_length=200, blank=True)
    guest_email = models.EmailField(blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    is_guest = models.BooleanField(default=False)
    num_guests = models.PositiveIntegerField(default=0)

    dietary_requirements = models.TextField(blank=True)
    special_needs = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    amount_payable = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    qr_code = models.CharField(max_length=100, blank=True)  # Store QR data or path
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["event", "member"]]  # One registration per member per event (member can be null for guest-only)
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.ticket_number} - {self.event.title}"

    def save(self, *args, **kwargs):
        if not self.ticket_number:
            from django.db.models import Max
            from django.db.models.functions import Coalesce
            last = EventRegistration.objects.aggregate(
                m=Coalesce(Max('id'), 0)
            )['m']
            self.ticket_number = f"TKT-{(last + 1):08d}"
        super().save(*args, **kwargs)


class EventCheckIn(models.Model):
    """Attendance check-in (QR or manual)."""
    registration = models.OneToOneField(
        EventRegistration,
        on_delete=models.CASCADE,
        related_name="check_in"
    )
    checked_in_at = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=20, default="qr")  # qr, manual
    checked_in_by = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"Check-in {self.registration.ticket_number}"
