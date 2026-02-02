from rest_framework import serializers
from .models import Task, Subtask


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
