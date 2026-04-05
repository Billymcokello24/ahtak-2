"""Audit logging and request context."""
import json
from .models import AuditLog


def get_client_ip(request):
    if not request:
        return None
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def get_user_agent(request):
    if not request:
        return ''
    return request.META.get('HTTP_USER_AGENT', '')[:500]


def log_audit(request, action, model_name='', object_id='', object_repr='', changes=None):
    """Create an audit log entry."""
    AuditLog.objects.create(
        user=request.user if request and getattr(request, 'user', None) and request.user.is_authenticated else None,
        action=action,
        model_name=model_name,
        object_id=str(object_id) if object_id else '',
        object_repr=str(object_repr)[:200] if object_repr else '',
        changes=changes or {},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request),
    )


def model_changes(old_instance, new_instance, fields):
    """Return dict of {field: [old_value, new_value]} for changed fields."""
    if not old_instance or not new_instance:
        return {}
    changes = {}
    for f in fields:
        old = getattr(old_instance, f, None)
        new = getattr(new_instance, f, None)
        if old != new:
            old_val = str(old) if old is not None else None
            new_val = str(new) if new is not None else None
            changes[f] = [old_val, new_val]
    return changes
