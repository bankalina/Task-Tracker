from rest_framework import serializers
from .models import Task, Subtask, UserTask
from django.contrib.auth import get_user_model

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    assigned_by = serializers.ReadOnlyField(source="assigned_by.username")

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at")


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subtask
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "task")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email"]


class UserTaskSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="user",
        write_only=True,
        required=False,
    )

    class Meta:
        model = UserTask
        fields = ["id", "task", "user", "user_id", "role"]
        read_only_fields = ("id", "task", "user")

    def validate(self, attrs):
        if self.instance is None and "user" not in attrs:
            raise serializers.ValidationError("user_id is required.")
        if self.instance is not None and "user" in attrs:
            raise serializers.ValidationError("Changing user is not allowed.")
        return attrs
        
