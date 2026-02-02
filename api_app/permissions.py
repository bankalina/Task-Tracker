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
