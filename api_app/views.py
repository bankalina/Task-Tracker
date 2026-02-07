from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api_app.models import Subtask, Task, UserTask
from api_app.permissions import TaskMembershipPermission, TaskRolePermission
from api_app.serializers import (
    SubtaskSerializer,
    TaskSerializer,
    UserRegisterSerializer,
    UserSerializer,
    UserTaskSerializer,
)
from api_app.services.auth_service import login_and_issue_tokens, register_user_and_issue_tokens
from api_app.services.membership_service import create_membership_for_task
from api_app.services.subtask_service import (
    create_subtask_for_task,
    ensure_can_delete_subtask,
    ensure_can_edit_subtask,
)
from api_app.services.task_service import create_task_for_user

User = get_user_model()


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        _user, tokens = register_user_and_issue_tokens(serializer)
        data = serializer.data
        data.update(tokens)
        headers = self.get_success_headers(serializer.data)
        return Response(data, status=status.HTTP_201_CREATED, headers=headers)


@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    tokens = login_and_issue_tokens(username=username, password=password)
    if not tokens:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(tokens, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile(request):
    user = request.user
    return Response(
        {"id": user.id, "username": user.username, "email": user.email},
        status=status.HTTP_200_OK,
    )


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(memberships__user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        create_task_for_user(serializer=serializer, user=self.request.user)


class TaskSubtaskListCreateView(generics.ListCreateAPIView):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated, TaskRolePermission]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]
        return Subtask.objects.filter(
            task_id=task_id,
            task__memberships__user=self.request.user,
        ).order_by("-created_at")

    def perform_create(self, serializer):
        task_id = self.kwargs["task_id"]
        create_subtask_for_task(serializer=serializer, task_id=task_id, user=self.request.user)


class TaskMembershipListCreateView(generics.ListCreateAPIView):
    serializer_class = UserTaskSerializer
    permission_classes = [IsAuthenticated, TaskMembershipPermission]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]
        return UserTask.objects.filter(task_id=task_id).select_related("user").order_by("id")

    def perform_create(self, serializer):
        task_id = self.kwargs["task_id"]
        create_membership_for_task(serializer=serializer, task_id=task_id)


class TaskMembershipDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserTaskSerializer
    permission_classes = [IsAuthenticated, TaskMembershipPermission]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]
        return UserTask.objects.filter(task_id=task_id).select_related("user")

    def get_object(self):
        task_id = self.kwargs["task_id"]
        user_id = self.kwargs["user_id"]
        return get_object_or_404(UserTask, task_id=task_id, user_id=user_id)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, TaskRolePermission]

    def get_queryset(self):
        return Task.objects.filter(memberships__user=self.request.user)


class SubtaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubtaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subtask.objects.filter(task__memberships__user=self.request.user)

    def perform_update(self, serializer):
        subtask = self.get_object()
        ensure_can_edit_subtask(subtask=subtask, user=self.request.user)
        serializer.save()

    def perform_destroy(self, instance):
        ensure_can_delete_subtask(subtask=instance, user=self.request.user)
        instance.delete()

