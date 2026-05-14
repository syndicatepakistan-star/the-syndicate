from django.db import migrations, models


def backfill_existing_lead_rows(apps, schema_editor):
    """
    Existing `LeadEvent` rows were created from the signup / checkout flow.
    Mark them with the auth kind + "Sign up lead" label so they keep counting
    toward the affiliate's auth slot under the new uniqueness rule.
    """

    LeadEvent = apps.get_model("affiliate_tracking", "LeadEvent")
    LeadEvent.objects.filter(lead_kind="").update(lead_kind="auth")
    LeadEvent.objects.filter(lead_label="").update(lead_label="Sign up lead")


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("affiliate_tracking", "0008_saleevent_purchase_subscription_fields"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="leadevent",
            unique_together=set(),
        ),
        migrations.AddField(
            model_name="leadevent",
            name="lead_kind",
            field=models.CharField(
                choices=[
                    ("diagnosis", "Syn Diagnosis lead"),
                    ("auth", "Sign up / Login lead"),
                ],
                default="auth",
                max_length=24,
            ),
        ),
        migrations.AddField(
            model_name="leadevent",
            name="lead_label",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.RunPython(backfill_existing_lead_rows, noop_reverse),
        migrations.AlterUniqueTogether(
            name="leadevent",
            unique_together={("referral", "visitor_id", "lead_kind")},
        ),
    ]
