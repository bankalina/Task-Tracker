from rest_framework.permissions import BasePermission, SAFE_METHODS
from .models import UserTask, UserTaskRole


class TaskRolePermission(BasePermission):
    """
    Object-level permission based on role in user_tasks:
    - Viewer: read-only
    - Assigned: can update
    - Owner: can update + delete
    """

    def has_object_permission(self, request, view, obj):
        membership = UserTask.objects.filter(task=obj, user=request.user).first()
        if membership is None:
            return False

        if request.method in SAFE_METHODS:
            return True

        if request.method in ("PUT", "PATCH"):
            return membership.role in (UserTaskRole.OWNER, UserTaskRole.ASSIGNED)

        if request.method == "DELETE":
            return membership.role == UserTaskRole.OWNER

        return False


class TaskMembershipPermission(BasePermission):
    def has_permission(self, request, view):
        task_id = view.kwargs.get("task_id")
        if not task_id:
            return False

        membership = UserTask.objects.filter(task_id=task_id, user=request.user).first()
        if membership is None:
            return False

        if request.method in SAFE_METHODS:
            return True

        return membership.role == UserTaskRole.OWNER

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True

        return UserTask.objects.filter(
            task=obj.task,
            user=request.user,
            role=UserTaskRole.OWNER,
        ).exists()
