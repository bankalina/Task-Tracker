from django.urls import path
from .views import login, profile, get_users, get_user_by_id, TaskListCreateView, TaskDetailView

urlpatterns = [
    path('users/', get_users),
    path('users/<int:id>/', get_user_by_id),
    path("login/", login),
    path("profile/", profile),
    path("tasks/", TaskListCreateView.as_view(), name="tasks_list_create"),
    path("tasks/<int:pk>/", TaskDetailView.as_view(), name="task_detail"),
]
