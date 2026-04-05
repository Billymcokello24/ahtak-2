from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    """Audit trail for user actions and data changes."""
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs'
    )
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=50, blank=True)
    object_repr = models.CharField(max_length=200, blank=True)
    changes = models.JSONField(default=dict, blank=True)  # {"field": ["old", "new"]}
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} {self.model_name}#{self.object_id} by {self.user_id}"


class UserProfile(models.Model):
    """Extended user profile with role and optional link to Member for self-service."""
    ROLE_CHOICES = [
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin/Accountant'),
        ('loan_officer', 'Loan Officer'),
        ('member', 'Member'),
    ]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    member = models.OneToOneField(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='user_account'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"
