from django.contrib.auth import authenticate, get_user_model
from django.db import IntegrityError
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.portal.entitlements import reconcile_dashboard_entitlement_from_plan_purchases
from apps.portal.serializers import UserMeSerializer

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or "@" not in email:
        return Response({"detail": "Valid email is required."}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 6:
        return Response({"detail": "Password must be at least 6 characters."}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=email).exists():
        return Response({"detail": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(username=email, email=email, password=password)
    except IntegrityError:
        return Response({"detail": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {
            "token": token.key,
            "user": {"id": user.id, "email": user.email},
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response({"detail": "Email and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    user = authenticate(username=email, password=password)
    if not user:
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
    reconcile_dashboard_entitlement_from_plan_purchases(user)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({"token": token.key, "user": {"id": user.id, "email": user.email}})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response({"ok": True})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """Same envelope as JWT `/api/auth/me/` so dashboard locks and tier work for DRF-token sessions."""
    reconcile_dashboard_entitlement_from_plan_purchases(request.user)
    return Response(UserMeSerializer(request.user).data)
