from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound
from rest_framework import status, generics
from django.contrib.auth import authenticate
from .utils import sign_token
from .models import Task, UserTask
from .serializers import TaskSerializer

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
        return Task.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Task.objects.all()

    def get_object(self):
        obj = super().get_object()
        return obj
