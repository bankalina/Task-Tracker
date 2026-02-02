from django.urls import path
from .views import (
    login,
    profile,
    get_users,
    get_user_by_id,
    TaskListCreateView,
    TaskDetailView,
    TaskSubtaskListCreateView,
    SubtaskDetailView,
)


urlpatterns = [
    path('users/', get_users),
    path('users/<int:id>/', get_user_by_id),
    path("login/", login),
    path("profile/", profile),
    path("tasks/", TaskListCreateView.as_view(), name="tasks_list_create"),
    path("tasks/<int:pk>/", TaskDetailView.as_view(), name="task_detail"),
    path("tasks/<int:task_id>/subtasks/", TaskSubtaskListCreateView.as_view(), name="task_subtasks"),
    path("subtasks/<int:pk>/", SubtaskDetailView.as_view(), name="subtask_detail"),
]
