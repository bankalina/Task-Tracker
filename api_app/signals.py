from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Task, UserTask, UserTaskRole


@receiver(post_save, sender=Task)
def ensure_task_owner(sender, instance: Task, created: bool, **kwargs):
    # Skip when loading fixtures (manage.py loaddata)
    if kwargs.get("raw", False):
        return
    
    if not created:
        return

    UserTask.objects.get_or_create(
        task=instance,
        user=instance.assigned_by,
        defaults={"role": UserTaskRole.OWNER},
    )
