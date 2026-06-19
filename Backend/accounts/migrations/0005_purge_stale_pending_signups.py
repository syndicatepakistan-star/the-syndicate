"""Remove PendingSignup rows for emails that already have User accounts."""

from django.conf import settings
from django.db import migrations


def purge_stale_pending_signups(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    PendingSignup = apps.get_model("accounts", "PendingSignup")
    registered = {e.lower() for e in User.objects.values_list("email", flat=True) if e}
    stale_ids = [
        row.id
        for row in PendingSignup.objects.only("id", "email").iterator()
        if (row.email or "").strip().lower() in registered
    ]
    if stale_ids:
        PendingSignup.objects.filter(id__in=stale_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_returningcheckout"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(purge_stale_pending_signups, migrations.RunPython.noop),
    ]
