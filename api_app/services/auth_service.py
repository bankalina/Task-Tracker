from django.contrib.auth import authenticate

from api_app.utils import sign_token


def login_and_issue_tokens(username: str, password: str):
    user = authenticate(username=username, password=password)
    if not user:
        return None
    return sign_token(user)


def register_user_and_issue_tokens(serializer):
    user = serializer.save()
    tokens = sign_token(user)
    return user, tokens

