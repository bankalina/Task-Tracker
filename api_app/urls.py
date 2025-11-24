from django.urls import path
from . import views
from .views import login, profile

urlpatterns = [
    path('users/', views.get_users),
    path('users/<int:id>/', views.get_user_by_id),
    path("login/", login),
    path("profile/", profile),
]
