from django.contrib.auth import get_user_model
from django.contrib.auth.models import update_last_login
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.portal.entitlements import reconcile_dashboard_entitlement_from_plan_purchases
from apps.portal.king_access import king_selection_completed, king_selection_required, king_selection_total_selected
from apps.portal.models import Mission, Note, PortalPermission, PortalRole, Reminder, SocialLink, UserDashboardEntitlement
from apps.portal.rbac import user_permission_codenames

User = get_user_model()


class PortalPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PortalPermission
        fields = ("codename", "name")


class PortalRoleSerializer(serializers.ModelSerializer):
    permissions = PortalPermissionSerializer(many=True, read_only=True)

    class Meta:
        model = PortalRole
        fields = ("id", "name", "display_name", "permissions")


class UserMeSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    access_tier = serializers.SerializerMethodField()
    dashboard_nav_locks = serializers.SerializerMethodField()
    king_program_selection_required = serializers.SerializerMethodField()
    king_program_selection_completed = serializers.SerializerMethodField()
    king_program_selection_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_staff",
            "roles",
            "permissions",
            "access_tier",
            "dashboard_nav_locks",
            "king_program_selection_required",
            "king_program_selection_completed",
            "king_program_selection_count",
        )

    def get_roles(self, obj):
        links = obj.portal_role_links.select_related("role").all()
        return [{"name": l.role.name, "display_name": l.role.display_name} for l in links]

    def get_permissions(self, obj):
        return sorted(user_permission_codenames(obj))

    def _effective_access_tier(self, obj: User) -> str:
        if getattr(obj, "is_staff", False) or getattr(obj, "is_superuser", False):
            return UserDashboardEntitlement.AccessTier.FULL
        try:
            ent = obj.dashboard_entitlement
        except UserDashboardEntitlement.DoesNotExist:
            return UserDashboardEntitlement.AccessTier.NONE
        return ent.access_tier

    def get_access_tier(self, obj: User) -> str:
        return self._effective_access_tier(obj)

    def _stored_entitlement_tier(self, obj: User) -> str:
        """DB tier for commercial locks — not upgraded to `full` for staff (Money Mastery must still lock King-only areas)."""
        try:
            return obj.dashboard_entitlement.access_tier
        except UserDashboardEntitlement.DoesNotExist:
            return UserDashboardEntitlement.AccessTier.NONE

    def get_dashboard_nav_locks(self, obj: User) -> dict[str, bool]:
        tier = self._stored_entitlement_tier(obj)
        # True = locked. Only The Knight (king tier) unlocks Syndicate Mode + Membership.
        if tier in (UserDashboardEntitlement.AccessTier.KING, UserDashboardEntitlement.AccessTier.FULL):
            return {"monk": False, "resources": False, "goals": False, "dashboard": False}
        if tier == UserDashboardEntitlement.AccessTier.MONEY_MASTERY:
            return {"monk": True, "resources": True, "goals": True, "dashboard": False}
        from apps.courses.access import _user_is_playlist_only_buyer

        if _user_is_playlist_only_buyer(obj):
            return {"monk": True, "resources": True, "goals": True, "dashboard": True}
        return {"monk": True, "resources": True, "goals": False, "dashboard": False}

    def get_king_program_selection_required(self, obj: User) -> bool:
        return king_selection_required(obj)

    def get_king_program_selection_completed(self, obj: User) -> bool:
        return king_selection_completed(obj)

    def get_king_program_selection_count(self, obj: User) -> int:
        return king_selection_total_selected(obj)


class SyndicateTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Login: return tokens + user envelope for frontend."""

    username_field = User.USERNAME_FIELD

    def validate(self, attrs):
        cred = (attrs.get(self.username_field) or "").strip()
        if cred:
            if "@" in cred:
                match = User.objects.filter(email__iexact=cred).first()
            else:
                match = User.objects.filter(username__iexact=cred).first()
            if match:
                attrs[self.username_field] = match.get_username()
        data = super().validate(attrs)
        reconcile_dashboard_entitlement_from_plan_purchases(self.user)
        data["user"] = UserMeSerializer(self.user).data
        update_last_login(None, self.user)
        return data


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ("id", "platform", "url", "label", "is_active", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_url(self, value: str):
        v = (value or "").strip()
        if not v.lower().startswith(("http://", "https://")):
            raise serializers.ValidationError("URL must use http or https.")
        return v

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class MissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mission
        fields = ("id", "title", "target_at", "points", "status", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reminder
        fields = ("id", "title", "date", "time", "points", "status", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ("id", "title", "body", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
