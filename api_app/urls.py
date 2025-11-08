from django.urls import path
from . import views

urlpatterns = [
    path('users/', views.get_users),
    path('users/<int:id>/', views.get_user_by_id),
]
