from django.db import models
from django.conf import settings
from django.utils import timezone


class TaskPriority(models.TextChoices):
    HIGH = "High", "High"
    MEDIUM = "Medium", "Medium"
    LOW = "Low", "Low"


class TaskStatus(models.TextChoices):
    TODO = "To do", "To do"
    IN_PROGRESS = "In progress", "In progress"
    DONE = "Done", "Done"


class UserTaskRole(models.TextChoices):
    OWNER = "Owner", "Owner"
    ASSIGNED = "Assigned", "Assigned"
    VIEWER = "Viewer", "Viewer"


class UserDetails(models.Model):
    """
    Mirrors legacy table: user_details(id_user PK, name, surname, phone)
    In Django we link it 1:1 to AUTH_USER_MODEL.
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="details",
        db_column="id_user",
    )
    name = models.CharField(max_length=50)
    surname = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = "user_details"

    def __str__(self) -> str:
        return f"{self.name} {self.surname}"


class Task(models.Model):
    """
    Mirrors legacy table: tasks
    - id (PK)
    - title (varchar 200)
    - description (text, nullable)
    - created_at, updated_at (timestamptz)
    - deadline (date, NOT NULL)
    - priority (enum)
    - status (enum, default 'To do')
    - id_assigned_by (FK -> users.id)
    """
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)
    deadline = models.DateField()
    priority = models.CharField(max_length=10, choices=TaskPriority.choices)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_tasks",
        db_column="id_assigned_by",
    )

    class Meta:
        db_table = "tasks"

    def save(self, *args, **kwargs):
        # Mimics legacy trigger update_updated_at_column
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title


class UserTask(models.Model):
    """
    Mirrors legacy join table: user_tasks
    Composite PK (id_task, id_user) -> in Django: unique constraint.
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="memberships",
        db_column="id_task",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_memberships",
        db_column="id_user",
    )
    role = models.CharField(
        max_length=10,
        choices=UserTaskRole.choices,
        default=UserTaskRole.ASSIGNED,
    )

    class Meta:
        db_table = "user_tasks"
        constraints = [
            models.UniqueConstraint(fields=["task", "user"], name="task_user_unique")
        ]

    def __str__(self) -> str:
        return f"{self.user_id} -> {self.task_id} ({self.role})"


class Subtask(models.Model):
    """
    Mirrors legacy table: subtasks
    """
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name="subtasks",
        db_column="id_task",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "subtasks"

    def save(self, *args, **kwargs):
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.title

