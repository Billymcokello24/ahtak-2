# members/models.py
import uuid
from django.db import models
from django.conf import settings


def member_photo_path(instance, filename):
    return f"members/{instance.member_number}/photo_{uuid.uuid4().hex[:8]}{filename[-4:] if '.' in filename else ''}"


def member_document_path(instance, filename):
    return f"members/{instance.member.member_number}/docs/{instance.document_type}_{uuid.uuid4().hex[:8]}{filename[-4:] if '.' in filename else ''}"


class MembershipType(models.Model):
    """Regular, Associate, Lifetime, Student, Corporate."""
    MEMBERSHIP_KINDS = [
        ("regular", "Regular Membership"),
        ("associate", "Associate Membership"),
        ("lifetime", "Lifetime Membership"),
        ("student", "Student Membership"),
        ("corporate", "Corporate Membership"),
    ]
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    kind = models.CharField(max_length=20, choices=MEMBERSHIP_KINDS, default="regular")
    annual_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    registration_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    validity_months = models.PositiveIntegerField(default=12)
    benefits_description = models.TextField(blank=True)
    has_voting_rights = models.BooleanField(default=True)
    loan_eligible = models.BooleanField(default=True)
    max_loan_amount = models.DecimalField(
        max_digits=14, decimal_places=2, null=True, blank=True,
        help_text="Max loan amount for this membership type"
    )
    special_terms = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class Member(models.Model):
    MEMBER_STATUS = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("suspended", "Suspended"),
        ("deceased", "Deceased"),
        ("pending_renewal", "Pending Renewal"),
        ("expired", "Expired"),
    ]
    GENDER_CHOICES = [("M", "Male"), ("F", "Female"), ("O", "Other")]

    # Auto-generated
    member_number = models.CharField(max_length=20, unique=True, editable=False)
    date_joined = models.DateField(auto_now_add=True)

    # Personal
    first_name = models.CharField(max_length=120)
    last_name = models.CharField(max_length=120)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    kvb_number = models.CharField(max_length=50, blank=True, help_text="Optional KVB registration number")

    # Contact
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    physical_address = models.TextField(blank=True)
    postal_address = models.CharField(max_length=255, blank=True)

    # Employment
    employment_status = models.CharField(max_length=50, blank=True)  # Employed, Self-employed, etc.
    employer_name = models.CharField(max_length=200, blank=True)
    occupation = models.CharField(max_length=100, blank=True)

    # Membership
    membership_type = models.ForeignKey(
        MembershipType,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members"
    )
    status = models.CharField(
        max_length=20,
        choices=MEMBER_STATUS,
        default="pending"
    )
    membership_expiry = models.DateField(null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_members"
    )

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.member_number} - {self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.member_number:
            from django.db.models import Max
            from django.db.models.functions import Coalesce
            last = Member.objects.aggregate(
                m=Coalesce(Max('id'), 0)
            )['m']
            self.member_number = f"ATK-{last + 1:05d}"
        super().save(*args, **kwargs)


class MemberDocument(models.Model):
    DOCUMENT_TYPES = [
        ("photo", "Member Photo"),
        ("other", "Other"),
    ]
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name="documents")
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    file = models.FileField(upload_to=member_document_path)
    description = models.CharField(max_length=200, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.member_number} - {self.get_document_type_display()}"
