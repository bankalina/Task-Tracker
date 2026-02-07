from django.db import IntegrityError
from rest_framework.exceptions import ValidationError


def create_membership_for_task(serializer, task_id):
    try:
        return serializer.save(task_id=task_id)
    except IntegrityError as exc:
        raise ValidationError({"detail": "User already assigned to this task."}) from exc

