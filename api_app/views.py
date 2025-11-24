from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import status
from django.contrib.auth import authenticate
from .utils import sign_token

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
