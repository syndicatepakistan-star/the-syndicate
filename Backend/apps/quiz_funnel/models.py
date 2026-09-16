from django.db import models


class User(models.Model):
    name = models.CharField(max_length=100, null=True, blank=True)
    email = models.CharField(max_length=255, null=True, blank=True, db_index=True)
    phone = models.CharField(max_length=50, null=True, blank=True)
    intake_ref = models.CharField(max_length=64, unique=True, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "users"


class Response(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="responses")
    question_id = models.IntegerField()
    selected_option = models.CharField(max_length=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "responses"


class Result(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="result")
    score = models.IntegerField()
    category = models.CharField(max_length=100)
    virus = models.CharField(max_length=150, null=True, blank=True)
    course_offer = models.CharField(max_length=255, null=True, blank=True)
    ai_report = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "results"


class QuizQuestion(models.Model):
    question_text = models.TextField()
    section = models.CharField(max_length=120, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "quiz_questions"


class QuizOption(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name="options")
    option_letter = models.CharField(max_length=1)
    option_text = models.TextField()
    position = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "quiz_options"


class IntakeResponse(models.Model):
    """Follow-up free-text answers linked to a Syn Diagnosis quiz user (via intake_ref URL)."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="intake")
    answers = models.JSONField(default=dict)
    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quiz_intake_responses"
        ordering = ("-submitted_at",)

    def __str__(self) -> str:
        return f"Intake #{self.pk} — {self.user.email or self.user_id}"


class AuditBooking(models.Model):
    """
    Founder audit call booked after intake submit.
    Datetimes are stored in UTC;
    """

    class Status(models.TextChoices):
        BOOKED = "booked", "Booked"
        CANCELLED = "cancelled", "Cancelled"
        COMPLETED = "completed", "Completed"

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="audit_bookings")
    slot_start = models.DateTimeField(help_text="UTC start of the audit slot.")
    slot_end = models.DateTimeField(help_text="UTC end of the audit slot.")
    timezone = models.CharField(max_length=64, default="Asia/Karachi")
    google_event_id = models.CharField(max_length=255, blank=True, default="")
    meet_link = models.URLField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.BOOKED,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "quiz_audit_bookings"
        ordering = ("-slot_start",)
        indexes = [
            models.Index(fields=["user", "status"], name="quiz_audit_user_status_idx"),
            models.Index(fields=["slot_start"], name="quiz_audit_slot_start_idx"),
        ]
        constraints = [
            # One active booked audit per quiz user (v1).
            models.UniqueConstraint(
                fields=["user"],
                condition=models.Q(status="booked"),
                name="uniq_quiz_audit_one_booked_per_user",
            ),
        ]

    def __str__(self) -> str:
        email = self.user.email or f"user:{self.user_id}"
        return f"AuditBooking {self.status} — {email} @ {self.slot_start.isoformat()}"