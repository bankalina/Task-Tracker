from django.urls import path
from .views import login, profile, get_users, get_user_by_id, TaskListCreateView

urlpatterns = [
    path('users/', get_users),
    path('users/<int:id>/', get_user_by_id),
    path("login/", login),
    path("profile/", profile),
    path("tasks/", TaskListCreateView.as_view(), name="tasks_list_create"),
]
