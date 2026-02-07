from django.db import transaction

from api_app.models import UserTask, UserTaskRole
from api_app.tasks import notify_task_created


def create_task_for_user(serializer, user):
    with transaction.atomic():
        task = serializer.save(assigned_by=user)
        UserTask.objects.get_or_create(
            task=task,
            user=user,
            defaults={"role": UserTaskRole.OWNER},
        )

    notify_task_created.delay(task.id)
    return task

