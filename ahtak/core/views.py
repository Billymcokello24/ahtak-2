from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


@api_view(['POST'])
@permission_classes([AllowAny])
def auth_token(request):
    """Login: returns token. Accepts JSON {username, password}. Case-insensitive for email."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''
    if not username or not password:
        return Response(
            {'non_field_errors': ['Please provide both username and password.']},
            status=status.HTTP_400_BAD_REQUEST
        )
    # Lookup: case-insensitive for email-style usernames (members use email as username)
    lookup_username = username.lower() if '@' in username else username
    try:
        user = User.objects.get(username__iexact=lookup_username)
    except User.DoesNotExist:
        user = None
    if user and not user.check_password(password):
        user = None
    elif user is None:
        user = authenticate(request, username=username, password=password)
    if user is None:
        return Response(
            {'non_field_errors': ['Invalid email/username or password.']},
            status=status.HTTP_400_BAD_REQUEST
        )
    if not user.is_active:
        return Response(
            {'non_field_errors': ['Your account is pending approval. Please wait for an administrator to approve your membership.']},
            status=status.HTTP_400_BAD_REQUEST
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response({'token': token.key})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Return current user and profile (role, member_id for self-service)."""
    user = request.user
    data = {
        'id': user.id,
        'username': user.username,
        'email': getattr(user, 'email', ''),
        'role': 'admin',
        'member_id': None,
    }
    if hasattr(user, 'profile'):
        data['role'] = user.profile.role
        if user.profile.member_id:
            data['member_id'] = user.profile.member.id
            data['member_number'] = user.profile.member.member_number
    return Response(data)
