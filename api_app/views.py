from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework import status, generics
from django.contrib.auth import authenticate
from .utils import sign_token
from .models import Task, UserTask, UserTaskRole, Subtask
from .serializers import TaskSerializer, SubtaskSerializer
from .permissions import TaskRolePermission

USERS = {
    1: {"id": 1, "name": "Jan Kowalski", "email": "jan@example.com"},
    2: {"id": 2, "name": "Anna Nowak", "email": "anna@example.com"},
}


@api_view(['POST'])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {"error": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    tokens = sign_token(user)

    return Response(tokens, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_users(request):
    return Response(list(USERS.values()), status=status.HTTP_200_OK)


@api_view(['GET'])
def get_user_by_id(request, id):
    if id not in USERS:
        return Response(
            {"error": "User not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response(USERS[id], status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user

    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    }, status=status.HTTP_200_OK)


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(memberships__user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        task = serializer.save(assigned_by=self.request.user)

        # Ensure the creator becomes the Owner (legacy trigger equivalent)
        UserTask.objects.get_or_create(
            task=task,
            user=self.request.user,
            defaults={"role": UserTaskRole.OWNER},
        )


class TaskSubtaskListCreateView(generics.ListCreateAPIView):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated, TaskRolePermission]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]
        # subtasks only for tasks where user is a member
        return Subtask.objects.filter(
            task_id=task_id,
            task__memberships__user=self.request.user,
        ).order_by("-created_at")

    def perform_create(self, serializer):
        task_id = self.kwargs["task_id"]
        # Allow create only if the user has update permissions (Assigned/Owner).
        # TaskRolePermission will currently return False for POST because POST is not an object-level check on Task.
        # Therefore, we perform a manual role check here.
        membership = UserTask.objects.filter(task_id=task_id, user=self.request.user).first()
        if membership is None:
            raise NotFound()
        if membership.role not in (UserTaskRole.OWNER, UserTaskRole.ASSIGNED):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to add subtasks for this task.")

        serializer.save(task_id=task_id)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, TaskRolePermission]

    def get_queryset(self):
        return Task.objects.filter(memberships__user=self.request.user)

    def get_object(self):
        obj = super().get_object()
        return obj
    

class SubtaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # access only if user a member of a task/subtask
        return Subtask.objects.filter(task__memberships__user=self.request.user)

    def perform_update(self, serializer):
        subtask = self.get_object()
        membership = UserTask.objects.filter(task=subtask.task, user=self.request.user).first()
        if membership.role not in (UserTaskRole.OWNER, UserTaskRole.ASSIGNED):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to edit this subtask.")
        serializer.save()

    def perform_destroy(self, instance):
        membership = UserTask.objects.filter(task=instance.task, user=self.request.user).first()
        if membership.role != UserTaskRole.OWNER:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the owner can delete subtasks.")
        instance.delete()
