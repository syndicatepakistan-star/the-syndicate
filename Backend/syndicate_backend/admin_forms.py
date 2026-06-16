"""Admin login: we use email as Django User.username; label the field Email for clarity."""
from django import forms
from django.contrib.admin.forms import AdminAuthenticationForm
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailAsUsernameAdminLoginForm(AdminAuthenticationForm):
    username = forms.CharField(
        label="Email",
        widget=forms.TextInput(attrs={"autocomplete": "email", "autofocus": True}),
    )
    password = forms.CharField(
        label="Password",
        strip=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password"}),
        help_text="Use your admin email or username from Railway DJANGO_SUPERUSER_* variables.",
    )

    def clean(self):
        raw = (self.cleaned_data.get("username") or "").strip()
        if raw:
            by_username = User.objects.filter(username__iexact=raw).first()
            if by_username is None and "@" in raw:
                by_email = User.objects.filter(email__iexact=raw).first()
                if by_email is not None:
                    self.cleaned_data["username"] = by_email.get_username()
            elif by_username is not None:
                self.cleaned_data["username"] = by_username.get_username()
        return super().clean()
