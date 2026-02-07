from django.contrib.auth import get_user_model
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiResponse,
    extend_schema,
    extend_schema_view,
)
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api_app.models import Subtask, Task, UserTask
from api_app.permissions import TaskMembershipPermission, TaskRolePermission
from api_app.serializers import (
    DeleteAccountSerializer,
    LoginRequestSerializer,
    ProfileSerializer,
    RegisterResponseSerializer,
    SubtaskSerializer,
    TaskSerializer,
    TokenPairSerializer,
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


TASK_REQUEST_EXAMPLE = OpenApiExample(
    "Create task request",
    value={
        "title": "Prepare sprint demo",
        "description": "Collect updates from all modules.",
        "deadline": "2026-03-01",
        "priority": "High",
        "status": "To do",
    },
    request_only=True,
)

TASK_RESPONSE_EXAMPLE = OpenApiExample(
    "Task response",
    value={
        "id": 42,
        "title": "Prepare sprint demo",
        "description": "Collect updates from all modules.",
        "created_at": "2026-02-07T18:10:00Z",
        "updated_at": "2026-02-07T18:10:00Z",
        "deadline": "2026-03-01",
        "priority": "High",
        "status": "To do",
        "assigned_by": "kalina",
    },
    response_only=True,
)

TASK_LIST_RESPONSE_EXAMPLE = OpenApiExample(
    "Task list response",
    value={
        "id": 42,
        "title": "Prepare sprint demo",
        "description": "Collect updates from all modules.",
        "created_at": "2026-02-07T18:10:00Z",
        "updated_at": "2026-02-07T18:10:00Z",
        "deadline": "2026-03-01",
        "priority": "High",
        "status": "To do",
        "assigned_by": "kalina",
    },
    response_only=True,
)

SUBTASK_REQUEST_EXAMPLE = OpenApiExample(
    "Create subtask request",
    value={
        "title": "Prepare API changelog",
        "description": "Summarize backend changes",
        "status": "In progress",
    },
    request_only=True,
)

SUBTASK_RESPONSE_EXAMPLE = OpenApiExample(
    "Subtask response",
    value={
        "id": 12,
        "task": 42,
        "title": "Prepare API changelog",
        "description": "Summarize backend changes",
        "status": "In progress",
        "created_at": "2026-02-07T18:30:00Z",
        "updated_at": "2026-02-07T18:40:00Z",
    },
    response_only=True,
)

MEMBERSHIP_REQUEST_EXAMPLE = OpenApiExample(
    "Create membership request",
    value={"user_id": 5, "role": "Assigned"},
    request_only=True,
)

MEMBERSHIP_RESPONSE_EXAMPLE = OpenApiExample(
    "Membership response",
    value={
        "id": 7,
        "task": 42,
        "user": {"id": 5, "username": "user4", "email": "user4@example.com"},
        "role": "Assigned",
    },
    response_only=True,
)


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        responses={200: UserSerializer(many=True), 401: OpenApiResponse(description="Unauthorized")},
        description="List all users (authenticated).",
    )
)
class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    get=extend_schema(
        tags=["Users"],
        responses={
            200: UserSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            404: OpenApiResponse(description="User not found"),
        },
        description="Get single user details by id (authenticated).",
    )
)
class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


@extend_schema_view(
    post=extend_schema(
        tags=["Auth"],
        request=UserRegisterSerializer,
        responses={
            201: RegisterResponseSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
        description="Register a new user and return JWT token pair.",
    )
)
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


@extend_schema(
    tags=["Auth"],
    request=LoginRequestSerializer,
    responses={
        200: TokenPairSerializer,
        401: OpenApiResponse(description="Invalid credentials"),
    },
    description="Authenticate with username/password and return JWT token pair.",
)
@api_view(["POST"])
def login(request):
    username = request.data.get("username")
    password = request.data.get("password")
    tokens = login_and_issue_tokens(username=username, password=password)
    if not tokens:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(tokens, status=status.HTTP_200_OK)


@extend_schema(
    methods=["GET"],
    tags=["Auth"],
    responses={
        200: ProfileSerializer,
        401: OpenApiResponse(description="Unauthorized"),
    },
    description="Return current authenticated user profile.",
)
@extend_schema(
    methods=["DELETE"],
    tags=["Auth"],
    request=DeleteAccountSerializer,
    responses={
        204: OpenApiResponse(description="Account deleted"),
        400: OpenApiResponse(description="Invalid password"),
        401: OpenApiResponse(description="Unauthorized"),
    },
    description="Delete current authenticated user account after password confirmation.",
)
@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == "GET":
        user = request.user
        return Response(
            {"id": user.id, "username": user.username, "email": user.email},
            status=status.HTTP_200_OK,
        )

    serializer = DeleteAccountSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    password = serializer.validated_data["password"]
    if not request.user.check_password(password):
        return Response(
            {"password": ["Invalid password."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    request.user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema_view(
    get=extend_schema(
        tags=["Tasks"],
        responses={
            200: TaskSerializer(many=True),
            401: OpenApiResponse(description="Unauthorized"),
        },
        description="List tasks where current user has membership.",
        examples=[TASK_LIST_RESPONSE_EXAMPLE],
    ),
    post=extend_schema(
        tags=["Tasks"],
        request=TaskSerializer,
        responses={
            201: TaskSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthorized"),
        },
        description="Create task and automatically create Owner membership for current user.",
        examples=[TASK_REQUEST_EXAMPLE, TASK_RESPONSE_EXAMPLE],
    ),
)
class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        membership_qs = UserTask.objects.filter(user=self.request.user).only("task_id", "role")
        return (
            Task.objects.filter(memberships__user=self.request.user)
            .prefetch_related(
                Prefetch("memberships", queryset=membership_qs, to_attr="current_user_memberships")
            )
            .order_by("-created_at")
            .distinct()
        )

    def perform_create(self, serializer):
        create_task_for_user(serializer=serializer, user=self.request.user)


@extend_schema_view(
    get=extend_schema(
        tags=["Subtasks"],
        responses={
            200: SubtaskSerializer(many=True),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
        },
        description="List subtasks for a task where current user has membership.",
        examples=[SUBTASK_RESPONSE_EXAMPLE],
    ),
    post=extend_schema(
        tags=["Subtasks"],
        request=SubtaskSerializer,
        responses={
            201: SubtaskSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Task not found"),
        },
        description="Create subtask (Owner/Assigned only).",
        examples=[SUBTASK_REQUEST_EXAMPLE, SUBTASK_RESPONSE_EXAMPLE],
    ),
)
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


@extend_schema_view(
    get=extend_schema(
        tags=["Memberships"],
        responses={
            200: UserTaskSerializer(many=True),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
        },
        description="List memberships for a task.",
        examples=[MEMBERSHIP_RESPONSE_EXAMPLE],
    ),
    post=extend_schema(
        tags=["Memberships"],
        request=UserTaskSerializer,
        responses={
            201: UserTaskSerializer,
            400: OpenApiResponse(description="Validation error or duplicate membership"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
        },
        description="Add user membership to task (Owner only).",
        examples=[MEMBERSHIP_REQUEST_EXAMPLE, MEMBERSHIP_RESPONSE_EXAMPLE],
    ),
)
class TaskMembershipListCreateView(generics.ListCreateAPIView):
    serializer_class = UserTaskSerializer
    permission_classes = [IsAuthenticated, TaskMembershipPermission]

    def get_queryset(self):
        task_id = self.kwargs["task_id"]
        return UserTask.objects.filter(task_id=task_id).select_related("user").order_by("id")

    def perform_create(self, serializer):
        task_id = self.kwargs["task_id"]
        create_membership_for_task(serializer=serializer, task_id=task_id)


@extend_schema_view(
    get=extend_schema(
        tags=["Memberships"],
        responses={
            200: UserTaskSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Membership not found"),
        },
        description="Get membership details by task/user id.",
    ),
    patch=extend_schema(
        tags=["Memberships"],
        request=UserTaskSerializer,
        responses={
            200: UserTaskSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Membership not found"),
        },
        description="Update membership role (Owner only).",
    ),
    delete=extend_schema(
        tags=["Memberships"],
        responses={
            204: OpenApiResponse(description="Membership deleted"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Membership not found"),
        },
        description="Remove membership (Owner only).",
    ),
)
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

    def perform_update(self, serializer):
        membership = self.get_object()
        if membership.user_id == self.request.user.id:
            raise ValidationError({"detail": "You cannot change your own role in this task."})
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id == self.request.user.id:
            raise ValidationError({"detail": "You cannot remove yourself from this task."})
        instance.delete()


@extend_schema_view(
    get=extend_schema(
        tags=["Tasks"],
        responses={
            200: TaskSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Task not found"),
        },
        description="Retrieve task details if user has membership.",
        examples=[TASK_RESPONSE_EXAMPLE],
    ),
    patch=extend_schema(
        tags=["Tasks"],
        request=TaskSerializer,
        responses={
            200: TaskSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Task not found"),
        },
        description="Update task (Owner/Assigned).",
        examples=[TASK_REQUEST_EXAMPLE, TASK_RESPONSE_EXAMPLE],
    ),
    delete=extend_schema(
        tags=["Tasks"],
        responses={
            204: OpenApiResponse(description="Task deleted"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Task not found"),
        },
        description="Delete task (Owner only).",
    ),
)
class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, TaskRolePermission]

    def get_queryset(self):
        membership_qs = UserTask.objects.filter(user=self.request.user).only("task_id", "role")
        return (
            Task.objects.filter(memberships__user=self.request.user)
            .prefetch_related(
                Prefetch("memberships", queryset=membership_qs, to_attr="current_user_memberships")
            )
            .distinct()
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Subtasks"],
        responses={
            200: SubtaskSerializer,
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Subtask not found"),
        },
        description="Retrieve subtask details if user has membership in parent task.",
        examples=[SUBTASK_RESPONSE_EXAMPLE],
    ),
    patch=extend_schema(
        tags=["Subtasks"],
        request=SubtaskSerializer,
        responses={
            200: SubtaskSerializer,
            400: OpenApiResponse(description="Validation error"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Subtask not found"),
        },
        description="Update subtask (Owner/Assigned only).",
        examples=[SUBTASK_REQUEST_EXAMPLE, SUBTASK_RESPONSE_EXAMPLE],
    ),
    delete=extend_schema(
        tags=["Subtasks"],
        responses={
            204: OpenApiResponse(description="Subtask deleted"),
            401: OpenApiResponse(description="Unauthorized"),
            403: OpenApiResponse(description="Forbidden"),
            404: OpenApiResponse(description="Subtask not found"),
        },
        description="Delete subtask (Owner only).",
    ),
)
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
