"""
Role-based access control for AHTTAK Membership System.

Roles: super_admin, admin, loan_officer, member
See ROLES.md for full definitions.
"""

from rest_framework import permissions


def get_user_role(request):
    if not request.user or not request.user.is_authenticated:
        return None
    if hasattr(request.user, 'profile'):
        return request.user.profile.role
    return 'admin'


def get_member_id(request):
    if not request.user or not request.user.is_authenticated:
        return None
    if hasattr(request.user, 'profile') and request.user.profile.member_id:
        return request.user.profile.member_id
    return None


def role_can_access(role, resource, action='read'):
    """Check if role can access resource. action: 'read' or 'write'."""
    ACCESS = {
        'super_admin': {r: 'rw' for r in ['members', 'events', 'payments', 'savings', 'contributions', 'reports', 'dashboard']},
        'admin': {r: 'rw' for r in ['members', 'events', 'payments', 'savings', 'contributions', 'reports', 'dashboard']},
        'loan_officer': {'members': 'r', 'events': 'r', 'payments': 'r', 'savings': 'r',
                        'contributions': 'r', 'reports': 'r', 'dashboard': 'r'},
        'member': {'members': 'own', 'events': 'r', 'payments': 'r', 'savings': 'own',
                   'contributions': 'own', 'reports': None, 'dashboard': 'r'},
    }
    acc = ACCESS.get(role, {})
    r = acc.get(resource)
    if r is None:
        return False
    if r == 'own':
        return True
    if action == 'write':
        return r == 'rw'
    return r in ('r', 'rw')


class RoleIn(permissions.BasePermission):
    """Allow only if user role is in allowed_roles. Set on view: allowed_roles = ['super_admin','admin']"""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = get_user_role(request)
        allowed = getattr(view, 'allowed_roles', None)
        if allowed is None:
            return True
        return role in allowed


class RoleRequired(permissions.BasePermission):
    """Require role to have access to resource. Set required_resource and required_action on the view."""
    def has_permission(self, request, view):
        role = get_user_role(request)
        if role is None:
            return False
        resource = getattr(view, 'required_resource', None)
        action = getattr(view, 'required_action', 'read')
        if resource:
            return role_can_access(role, resource, action)
        return True


class IsMemberOwnerOrStaff(permissions.BasePermission):
    """Staff can access any; member-role can access only own data (member_id match)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        role = get_user_role(request)
        if role in ('super_admin', 'admin', 'loan_officer'):
            return True
        if role == 'member' and view.action == 'create':
            # Members cannot create new Member records
            return False
        return True

    def has_object_permission(self, request, view, obj):
        role = get_user_role(request)
        if role in ('super_admin', 'admin', 'loan_officer'):
            return True
        if role == 'member':
            mid = get_member_id(request)
            if mid is None:
                return False
            if hasattr(obj, 'member_id'):
                return obj.member_id == mid
            if hasattr(obj, 'member'):
                return getattr(obj.member, 'id', None) == mid
            if obj.__class__.__name__ == 'Member' and hasattr(obj, 'id'):
                return obj.id == mid
        return False
