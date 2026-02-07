from rest_framework.exceptions import NotFound, PermissionDenied

from api_app.models import UserTask, UserTaskRole


def create_subtask_for_task(serializer, task_id, user):
    membership = UserTask.objects.filter(task_id=task_id, user=user).first()
    if membership is None:
        raise NotFound()
    if membership.role not in (UserTaskRole.OWNER, UserTaskRole.ASSIGNED):
        raise PermissionDenied("You don't have permission to add subtasks for this task.")

    return serializer.save(task_id=task_id)


def ensure_can_edit_subtask(subtask, user):
    membership = UserTask.objects.filter(task=subtask.task, user=user).first()
    if membership is None:
        raise NotFound()
    if membership.role not in (UserTaskRole.OWNER, UserTaskRole.ASSIGNED):
        raise PermissionDenied("You don't have permission to edit this subtask.")


def ensure_can_delete_subtask(subtask, user):
    membership = UserTask.objects.filter(task=subtask.task, user=user).first()
    if membership is None:
        raise NotFound()
    if membership.role != UserTaskRole.OWNER:
        raise PermissionDenied("Only the owner can delete subtasks.")

